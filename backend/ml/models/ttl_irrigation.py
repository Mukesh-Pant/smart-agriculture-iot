"""
TTL: Transformer-Based Tabular Learning for Irrigation Advice
=============================================================
Implements the FT-Transformer (Feature Tokenizer + Transformer) architecture.

Architecture:
  1. Feature Tokenizer: each numerical feature → d-dimensional embedding
     (categorical features use learnable embedding tables)
  2. [CLS] token prepended to the feature token sequence
  3. Transformer Encoder: L layers of multi-head self-attention + FFN
  4. [CLS] output extracted → MLP head → irrigation class

Reference: Gorishniy et al. "Revisiting Deep Learning Models for Tabular Data"
           NeurIPS 2021 (arXiv 2106.11959)
Paper usage: "AI-Driven Smart Agriculture: An Integrated Approach"
"""
import torch
import torch.nn as nn
import torch.nn.functional as F


class FeatureTokenizer(nn.Module):
    """
    Converts each numerical feature to a d-dimensional token.
    Uses a weight vector W_i and bias b_i per feature:
      token_i = x_i * W_i + b_i   (x_i is scalar)
    """

    def __init__(self, num_numerical: int, num_categorical: list, d_token: int):
        """
        num_numerical:   count of continuous features
        num_categorical: list of cardinalities for each categorical feature
        d_token:         embedding dimension
        """
        super().__init__()
        self.d_token = d_token
        self.num_weight = nn.Parameter(torch.empty(num_numerical, d_token))
        self.num_bias   = nn.Parameter(torch.zeros(num_numerical, d_token))
        nn.init.kaiming_uniform_(self.num_weight)

        # Use the maximum cardinality + 1 as the shared vocab size so that
        # all categorical columns can safely use any index in [0, max_card].
        max_card = max(num_categorical) if num_categorical else 1
        self.cat_embeddings = nn.ModuleList([
            nn.Embedding(max_card + 1, d_token)
            for _ in num_categorical
        ])

    def forward(self, x_num: torch.Tensor, x_cat: torch.Tensor = None) -> torch.Tensor:
        """
        x_num: [B, num_numerical]
        x_cat: [B, num_categorical]  (long tensor, optional)
        returns: [B, seq_len, d_token]
        """
        num_tokens = x_num.unsqueeze(-1) * self.num_weight.unsqueeze(0) + self.num_bias

        if x_cat is not None and x_cat.shape[1] > 0:
            cat_tokens = torch.stack(
                [emb(x_cat[:, i]) for i, emb in enumerate(self.cat_embeddings)],
                dim=1
            )
            return torch.cat([num_tokens, cat_tokens], dim=1)

        return num_tokens


class TransformerBlock(nn.Module):
    """Standard pre-norm Transformer encoder block."""

    def __init__(self, d_token: int, num_heads: int, ffn_mult: int = 4, dropout: float = 0.1):
        super().__init__()
        self.attn  = nn.MultiheadAttention(d_token, num_heads, dropout=dropout, batch_first=True)
        self.ffn   = nn.Sequential(
            nn.Linear(d_token, d_token * ffn_mult),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(d_token * ffn_mult, d_token),
        )
        self.norm1 = nn.LayerNorm(d_token)
        self.norm2 = nn.LayerNorm(d_token)
        self.drop  = nn.Dropout(dropout)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = x + self.drop(self.attn(self.norm1(x), self.norm1(x), self.norm1(x))[0])
        x = x + self.drop(self.ffn(self.norm2(x)))
        return x


class TTLIrrigationModel(nn.Module):
    """
    FT-Transformer for irrigation advice.

    Handles both numerical features (soil_moisture, temperature, etc.)
    and categorical features (crop_type, growth_stage).

    Returns 5 irrigation class logits:
      0: Sufficient Moisture — No Irrigation Needed
      1: Moderate — Irrigation Recommended
      2: Moderate — Irrigation Highly Recommended
      3: Very Dry — Irrigation Needed
      4: Very Dry — Immediate Irrigation Needed
    """

    def __init__(
        self,
        num_numerical:   int  = 9,
        num_categorical: list = None,
        num_classes:     int  = 5,
        d_token:         int  = 64,
        num_heads:       int  = 4,
        num_layers:      int  = 2,
        dropout:         float = 0.1,
    ):
        super().__init__()
        if num_categorical is None:
            num_categorical = [9, 4]
        self.num_numerical   = num_numerical
        self.num_categorical = num_categorical

        self.tokenizer = FeatureTokenizer(num_numerical, num_categorical, d_token)

        self.cls_token = nn.Parameter(torch.zeros(1, 1, d_token))
        nn.init.normal_(self.cls_token, std=0.02)

        self.blocks = nn.ModuleList([
            TransformerBlock(d_token, num_heads, dropout=dropout)
            for _ in range(num_layers)
        ])

        self.head = nn.Sequential(
            nn.LayerNorm(d_token),
            nn.Linear(d_token, d_token // 2),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(d_token // 2, num_classes),
        )

    def forward(self, x_num: torch.Tensor, x_cat: torch.Tensor = None) -> torch.Tensor:
        """
        x_num: [B, num_numerical]
        x_cat: [B, num_categorical_features]  (long tensor)
        returns: [B, num_classes] logits
        """
        B = x_num.size(0)

        tokens = self.tokenizer(x_num, x_cat)

        cls = self.cls_token.expand(B, 1, -1)
        tokens = torch.cat([cls, tokens], dim=1)

        for block in self.blocks:
            tokens = block(tokens)

        cls_out = tokens[:, 0, :]
        return self.head(cls_out)


def make_ttl_config(
    num_numerical=9, num_categorical=None,
    num_classes=5, d_token=64, num_heads=4, num_layers=2
) -> dict:
    """Returns a config dict for TTL model reconstruction at load time."""
    if num_categorical is None:
        num_categorical = [9, 4]
    return {
        "num_numerical":   num_numerical,
        "num_categorical": num_categorical,
        "num_classes":     num_classes,
        "d_token":         d_token,
        "num_heads":       num_heads,
        "num_layers":      num_layers,
    }
