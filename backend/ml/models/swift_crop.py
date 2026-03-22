"""
SwiFT: Sparse Weighted Fusion Transformer for Crop Recommendation
=================================================================
Architecture follows the reference paper:
  - Each input feature is embedded as a separate token
  - Sparse multi-head self-attention captures feature dependencies
    (Adaptive Sparsity matrix A zeroes irrelevant connections)
  - Weighted feature fusion aggregates attended representations
  - MLP classification head predicts crop class

Reference: "AI-Driven Smart Agriculture: An Integrated Approach"
"""
import math
import torch
import torch.nn as nn
import torch.nn.functional as F


class SparseAttention(nn.Module):
    """Multi-head self-attention with top-k adaptive sparsity."""

    def __init__(self, hidden_dim: int, num_heads: int, sparsity_k: int, dropout: float = 0.1):
        super().__init__()
        assert hidden_dim % num_heads == 0
        self.num_heads = num_heads
        self.head_dim  = hidden_dim // num_heads
        self.sparsity_k = sparsity_k

        self.W_q = nn.Linear(hidden_dim, hidden_dim, bias=False)
        self.W_k = nn.Linear(hidden_dim, hidden_dim, bias=False)
        self.W_v = nn.Linear(hidden_dim, hidden_dim, bias=False)
        self.W_o = nn.Linear(hidden_dim, hidden_dim)
        self.drop = nn.Dropout(dropout)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        x: [B, seq_len, hidden_dim]  (seq_len = num_features as tokens)
        returns: [B, seq_len, hidden_dim]
        """
        B, S, H = x.shape
        h, d = self.num_heads, self.head_dim

        Q = self.W_q(x).view(B, S, h, d).transpose(1, 2)  # [B, h, S, d]
        K = self.W_k(x).view(B, S, h, d).transpose(1, 2)
        V = self.W_v(x).view(B, S, h, d).transpose(1, 2)

        scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(d)

        # Adaptive Sparsity: keep only top-k attention scores per query row
        k = min(self.sparsity_k, S)
        topk_vals, topk_idx = scores.topk(k, dim=-1)
        sparse = torch.full_like(scores, float('-inf'))
        sparse.scatter_(-1, topk_idx, topk_vals)

        attn_weights = F.softmax(sparse, dim=-1)
        attn_weights = self.drop(attn_weights)

        out = torch.matmul(attn_weights, V)                # [B, h, S, d]
        out = out.transpose(1, 2).contiguous().view(B, S, H)
        return self.W_o(out)


class SwiFTBlock(nn.Module):
    """One SwiFT encoder block: sparse-attention + FFN + LayerNorm."""

    def __init__(self, hidden_dim: int, num_heads: int, sparsity_k: int,
                 ffn_mult: int = 2, dropout: float = 0.1):
        super().__init__()
        self.attn  = SparseAttention(hidden_dim, num_heads, sparsity_k, dropout)
        self.ffn   = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim * ffn_mult),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim * ffn_mult, hidden_dim),
        )
        self.norm1 = nn.LayerNorm(hidden_dim)
        self.norm2 = nn.LayerNorm(hidden_dim)
        self.drop  = nn.Dropout(dropout)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = x + self.drop(self.attn(self.norm1(x)))
        x = x + self.drop(self.ffn(self.norm2(x)))
        return x


class SwiFTCropModel(nn.Module):
    """
    SwiFT crop recommendation model.

    Treats each input feature as an independent token.
    Sparse attention captures which features interact (e.g. N↔pH).
    Weighted fusion pools feature-level representations.
    MLP head maps to crop classes.
    """

    def __init__(
        self,
        input_dim:   int = 13,
        num_classes: int = 22,
        hidden_dim:  int = 64,
        num_heads:   int = 4,
        num_layers:  int = 2,
        sparsity_k:  int = 5,
        dropout:     float = 0.2,
    ):
        super().__init__()
        self.input_dim  = input_dim
        self.hidden_dim = hidden_dim

        # Per-feature scalar → vector embedding
        self.feature_embed = nn.Linear(1, hidden_dim)

        # Stack of SwiFT encoder blocks
        self.blocks = nn.ModuleList([
            SwiFTBlock(hidden_dim, num_heads, sparsity_k, dropout=dropout)
            for _ in range(num_layers)
        ])

        # Learnable weighted fusion gate
        self.fusion_gate = nn.Linear(hidden_dim, 1)

        # Classification head
        self.head = nn.Sequential(
            nn.LayerNorm(hidden_dim),
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim // 2, num_classes),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        x: [B, input_dim] — normalised feature vector
        returns: [B, num_classes] logits
        """
        tokens = x.unsqueeze(-1)               # [B, input_dim, 1]
        tokens = self.feature_embed(tokens)    # [B, input_dim, hidden_dim]

        for block in self.blocks:
            tokens = block(tokens)

        gate_w = torch.softmax(self.fusion_gate(tokens), dim=1)   # [B, input_dim, 1]
        fused  = (gate_w * tokens).sum(dim=1)                      # [B, hidden_dim]

        return self.head(fused)

    def get_feature_attention(self, x: torch.Tensor):
        """Returns attention-based feature importance for XAI (no_grad)."""
        with torch.no_grad():
            tokens = self.feature_embed(x.unsqueeze(-1))
            for block in self.blocks:
                tokens = block(tokens)
            gate_w = torch.softmax(self.fusion_gate(tokens), dim=1)
        return gate_w.squeeze(-1).cpu().numpy()   # [B, input_dim]
