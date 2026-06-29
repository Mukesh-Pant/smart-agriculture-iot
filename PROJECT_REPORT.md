# FAR WESTERN UNIVERSITY
## FACULTY OF ENGINEERING
## SCHOOL OF ENGINEERING
## COMPUTER ENGINEERING PROGRAM

---

# A Project Report
## On
## IoT-Enabled Smart Agriculture Monitoring and Decision Support System

---

**Submitted By:**

Sapana Pandey ([Exam Roll No.])

Mukesh Pant ([Exam Roll No.])

Adarsh Joshi ([Exam Roll No.])

Sagar Bista ([Exam Roll No.])

---

**Submitted To:**

Computer Engineering Program
School of Engineering
Mahendranagar, Nepal

---

July, 2026

---

*(Page break)*

---

# FAR WESTERN UNIVERSITY
## FACULTY OF ENGINEERING
## SCHOOL OF ENGINEERING
## COMPUTER ENGINEERING PROGRAM

---

# A Project Report
## On
## IoT-Enabled Smart Agriculture Monitoring and Decision Support System

---

**Submitted By:**

Sapana Pandey ([Exam Roll No.])

Mukesh Pant ([Exam Roll No.])

Adarsh Joshi ([Exam Roll No.])

Sagar Bista ([Exam Roll No.])

---

**Submitted To:**

Computer Engineering Program
School of Engineering
Mahendranagar, Nepal

In partial fulfillment for the award of the Bachelor's Degree in Computer Engineering.

**Under the Supervision of**

Er. Birendra Singh Dhami

Er. Kamal Lekhak

July, 2026

---

*(Page break — Title Page ends here)*

---

## DECLARATION

We hereby declare that the report of the project entitled "IoT-Enabled Smart Agriculture Monitoring and Decision Support System" which is being submitted to the **Computer Engineering Program, Faculty of Engineering, School of Engineering**, in the partial fulfillment of the requirements for the award of the Degree of Bachelor of Engineering in **Computer Engineering**, is a bonafide report of the work carried out by us. The materials contained in this report have not been submitted to any University or Institution for the award of any degree and we are the only authors of this complete work and no sources other than those listed here have been used in this work.

Sapana Pandey (Class Roll No.: [___])

Mukesh Pant (Class Roll No.: [___])

Adarsh Joshi (Class Roll No.: [___])

Sagar Bista (Class Roll No.: [___])

**Date:** July, 2026

---

*(Page i)*

---

## CERTIFICATE OF APPROVAL

The undersigned certify that they have read and recommended to the **Computer Engineering Program, FWU, Faculty of Engineering, School of Engineering**, a major project work entitled "**IoT-Enabled Smart Agriculture Monitoring and Decision Support System**" submitted by **Sapana Pandey, Mukesh Pant, Adarsh Joshi** and **Sagar Bista** in partial fulfillment for the award of Bachelor's Degree in Computer Engineering. The project was carried out under special supervision and within the time frame prescribed by the syllabus.

We found the students to be hardworking, skilled and ready to undertake any related work to their field of study and hence we recommend the award of partial fulfillment of Bachelor's Degree in Computer Engineering.

<br>

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

**Project Supervisor**
Er. Birendra Singh Dhami
Computer Engineering Program, FWU, FOE, School of Engineering

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

**Project Supervisor**
Er. Kamal Lekhak
Computer Engineering Program, FWU, FOE, School of Engineering

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

**External Examiner**
Mr. \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
Computer Engineering Program, FWU, FOE, School of Engineering

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

**Program Co-ordinator**
Mr. \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
Computer Engineering Program, FWU, FOE, School of Engineering

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

**Head of the School**
Mr. \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
FWU, FOE, School of Engineering

July, 2026

---

*(Page ii)*

---

## COPYRIGHT

The author has agreed that the library, FWU, FOE, School of Engineering, may make this report freely available for inspection. Moreover, the author has agreed that permission for extensive copying of this project work for scholarly purpose may be granted by the professor or lecturer who supervised the project work recorded herein, or in their absence, by the head of the department. It is understood that recognition will be given to the author of this report and to the Computer Engineering Program, FWU, FOE, School of Engineering in any use of the material of this report. Copying or other use of this report for financial gain without approval of the Computer Engineering Program, FWU, FOE, School of Engineering and the author's written permission is prohibited.

Request for permission to copy or to make any use of the material in this project in whole or part should be addressed to Computer Engineering Program, FWU, FOE, School of Engineering.

---

*(Page iv)*

---

## ACKNOWLEDGEMENT

We would like to express our sincere gratitude to Prof. Kishan Datta Bhatta, the Dean of School of Engineering, Far Western University, and Er. Toran Prasad Bhatta, Head of School, School of Engineering, for providing us with the platform to present our ideas and the continuous encouragement throughout this project.

We extend our heartfelt thanks to our supervisors, Er. Birendra Singh Dhami and Er. Kamal Lekhak, whose guidance, technical expertise, and constructive feedback shaped this project from its initial concept through to its final form. Their patience in reviewing our work and willingness to discuss problems at every stage made a genuine difference in the quality of what we delivered.

We also express our sincere appreciation to Birodh Rijal Sir, whose initial orientation helped us visualize the foundation of this project. His suggestions gave us the direction we needed to move forward with confidence.

Our thanks go to Dr. Prakash Datta Sir, Rishi K. Marseni Sir, Shiv Raj Pant Sir, Er. Guru Prasad Lekhak Sir, and Er. Rohit Bisht Sir for their valuable insights and continuous encouragement during different phases of this work. Their collective experience helped refine our approach significantly.

Lastly, we thank all our classmates for their cooperation, support, and motivation throughout this project. Their help and team spirit made this journey smoother and more enjoyable.

Sapana Pandey (Class Roll No.: [___])

Mukesh Pant (Class Roll No.: [___])

Adarsh Joshi (Class Roll No.: [___])

Sagar Bista (Class Roll No.: [___])

---

*(Page v)*

---

## ABSTRACT

Agriculture contributes to about one-third of Nepal's gross domestic product and employs a majority of the working population, yet most farmers continue to rely on intuition and traditional practices when making decisions about crops, irrigation, and fertilizers. This project presents an IoT-enabled smart agriculture monitoring and decision support system that collects real-time soil and environmental data through low-cost sensors, transmits it wirelessly to a cloud backend, and applies trained machine learning models to generate recommendations for crop selection, fertilizer application, and irrigation scheduling.

The hardware layer consists of an ESP32 microcontroller connected to a DHT22 temperature and humidity sensor, a capacitive soil moisture sensor, and a PH-4502C pH sensor. Sensor readings are published every 10 seconds over MQTT to a FastAPI backend hosted on AWS. The backend stores all readings in MongoDB and integrates live weather data from OpenWeatherMap for the Mahendranagar region.

Four machine learning models power the recommendation engine. Crop recommendation across eighteen crops grown in Nepal is performed by a soft-voting ensemble of Random Forest, XGBoost and LightGBM classifiers, achieving 95.15% test accuracy (97.78% under five-fold cross-validation) on a 2,200-sample dataset that combines real records from the Kaggle Crop Recommendation Dataset with synthetic samples for Nepal-specific crops; this tree-ensemble approach substantially outperforms the deep-learning transformer used in the earlier design. A TTL (Tabular Transfer Learning) model provides crop-aware irrigation scheduling across five urgency classes with 97.67% test accuracy on a 12,000-sample hybrid dataset incorporating crop type, growth stage, and FAO-56 evapotranspiration estimates. A TabNet model performs soil fertility classification (Low, Medium, High) with 99.44% test accuracy on 6,000 samples, and a second TabNet model recommends among the five fertilizers available in Nepal with 97.43% test accuracy on a 10,099-sample dataset. Both TabNet models include LIME-based explainability to show which soil parameters influenced each recommendation. When a farmer confirms a recommended crop, the fertilizer and irrigation models personalise their advice to that specific crop.

The frontend is a Next.js 16 web application with real-time dashboard visualization using Recharts, displaying live sensor readings, multi-range historical trends spanning 48 hours to 6 months, and ML-generated recommendations. The complete system is containerized with Docker and deployed on AWS EC2 with a CI/CD pipeline through GitHub Actions.

This system demonstrates that an affordable, sensor-based agricultural monitoring and recommendation platform is technically achievable using open-source tools and publicly available datasets, and that it can deliver real-time guidance to farmers through a simple web interface.

**Keywords:** crop recommendation, decision support system, ensemble learning, ESP32, FastAPI, fertilizer recommendation, Internet of Things, irrigation scheduling, LightGBM, machine learning, MQTT, Random Forest, smart agriculture, soil monitoring, TabNet, XGBoost

---

*(Page vii)*

---
## TABLE OF CONTENTS

| Section | Page |
|---|---|
| DECLARATION | i |
| CERTIFICATE OF APPROVAL | ii |
| COPYRIGHT | iv |
| ACKNOWLEDGEMENT | v |
| ABSTRACT | vii |
| TABLE OF CONTENTS | ix |
| LIST OF FIGURES | xii |
| LIST OF TABLES | xiii |
| LIST OF ABBREVIATIONS | xiv |
| **1. INTRODUCTION** | 1 |
| 1.1 Background | 1 |
| 1.2 Motivation | 2 |
| 1.3 Problem Definition | 3 |
| 1.4 Project Objectives | 3 |
| 1.5 Project Scope and Applications | 4 |
| 1.6 Report Organization | 4 |
| **2. LITERATURE REVIEW** | 6 |
| 2.1 IoT Platforms for Smart Agriculture | 6 |
| 2.2 Sensor Integration and Communication | 6 |
| 2.3 Machine Learning for Crop Recommendation | 7 |
| 2.4 Deep Tabular Learning Methods | 7 |
| 2.5 Integrated IoT-AI Systems | 8 |
| 2.6 Socio-Technical Challenges | 8 |
| 2.7 Explainability in Agricultural AI | 8 |
| 2.8 Research Gap and Project Positioning | 9 |
| **3. REQUIREMENT ANALYSIS** | 10 |
| 3.1 Hardware Requirements | 10 |
| 3.2 Software Requirements | 11 |
| 3.3 Dataset Requirements | 12 |
| 3.4 Feasibility Study | 13 |
| 3.4.1 Technical Feasibility | 13 |
| 3.4.2 Operational Feasibility | 13 |
| 3.4.3 Economic Feasibility | 13 |
| 3.4.4 Schedule Feasibility | 13 |
| 3.5 Constraints and Assumptions | 14 |
| **4. SYSTEM ARCHITECTURE AND METHODOLOGY** | 15 |
| 4.1 System Overview | 15 |
| 4.2 IoT Data Acquisition Methodology | 16 |
| 4.2.1 Sensor Reading Process | 16 |
| 4.2.2 Sensor Calibration | 16 |
| 4.2.3 MQTT Payload Structure | 16 |
| 4.3 Backend Architecture | 17 |
| 4.3.1 FastAPI Application Structure | 17 |
| 4.3.2 MQTT to Database Bridge | 17 |
| 4.3.3 Weather Integration | 17 |
| 4.4 Machine Learning Methodology | 17 |
| 4.4.1 Model Selection Rationale | 17 |
| 4.4.2 Feature Engineering | 20 |
| 4.4.3 Training Configuration | 20 |
| 4.4.4 Explainable AI (LIME) | 21 |
| 4.5 Crop-Aware Decision Flow | 21 |
| 4.6 Frontend Architecture | 22 |
| 4.7 Deployment Architecture | 22 |
| **5. IMPLEMENTATION DETAILS** | 24 |
| 5.1 Hardware Implementation | 24 |
| 5.1.1 ESP32 Microcontroller Setup | 24 |
| 5.1.2 DHT22 Temperature and Humidity Sensor | 24 |
| 5.1.3 Capacitive Soil Moisture Sensor | 24 |
| 5.1.4 PH-4502C pH Sensor | 24 |
| 5.1.5 Power Supply | 25 |
| 5.2 Firmware Implementation | 25 |
| 5.3 Backend Implementation | 25 |
| 5.3.1 FastAPI Application Lifecycle | 25 |
| 5.3.2 API Endpoints | 26 |
| 5.3.3 MongoDB Schema | 26 |
| 5.3.4 CORS and Security | 26 |
| 5.4 Machine Learning Training Pipeline | 27 |
| 5.4.1 Crop Ensemble Training (RF + XGBoost + LightGBM) | 27 |
| 5.4.2 TTL Irrigation Training | 27 |
| 5.4.3 TabNet Soil Fertility Training | 28 |
| 5.4.4 TabNet Fertilizer Training | 28 |
| 5.5 Frontend Implementation | 28 |
| 5.5.1 Application Structure | 28 |
| 5.5.2 Dashboard Features | 28 |
| 5.5.3 Historical Analytics (Multi-Range Trends) | 29 |
| 5.5.4 Authentication | 30 |
| **6. RESULTS AND ANALYSIS** | 31 |
| 6.1 Machine Learning Model Results | 31 |
| 6.1.1 Crop Ensemble Recommendation Results | 31 |
| 6.1.2 TTL Irrigation Scheduling Results | 32 |
| 6.1.3 TabNet Soil Fertility Results | 33 |
| 6.1.4 TabNet Fertilizer Recommendation Results | 33 |
| 6.2 Comparative Model Summary | 34 |
| 6.3 Sensor Validation | 35 |
| 6.4 System Performance | 35 |
| 6.4.1 Data Transmission Reliability | 35 |
| 6.4.2 End-to-End Latency | 35 |
| 6.4.3 ML Inference Time | 36 |
| 6.5 Error Analysis and Limitations | 36 |
| **7. FUTURE ENHANCEMENT** | 37 |
| 7.1 Local Dataset Collection and Model Retraining | 37 |
| 7.2 NPK Sensor Integration | 37 |
| 7.3 Mobile Application | 37 |
| 7.4 LoRa Communication for Remote Areas | 37 |
| 7.5 Multi-Node Network | 38 |
| 7.6 Online Learning and Model Drift Detection | 38 |
| 7.7 Pest and Disease Detection | 38 |
| 7.8 SMS and Voice Alerts for Low-Connectivity Farmers | 38 |
| **8. CONCLUSION** | 39 |
| **APPENDICES** | 41 |
| Appendix A: Project Budget | 41 |
| Appendix B: Project Timeline (Gantt Chart) | 42 |
| Appendix C: ESP32 Wiring Guide | 42 |
| Appendix D: ML Model Artifacts | 43 |
| Appendix E: API Endpoint Documentation | 43 |
| **REFERENCES** | 45 |

---

## LIST OF FIGURES

| Figure | Page |
|---|---|
| Figure 1: Overall System Block Diagram | 15 |
| Figure 2: Crop-Aware Decision Flow Diagram | 22 |
| Figure 3: Deployment Architecture Diagram | 23 |
| Figure 4: Assembled Hardware Prototype | 25 |
| Figure 5: Web Dashboard – Real-Time Sensor Display | 29 |
| Figure 6: Web Dashboard – ML Advisor Input Form | 29 |
| Figure 7: Web Dashboard – Multi-Range Analytics View | 30 |
| Figure 8: Crop Ensemble – Per-Class Classification Results | 32 |
| Figure 9: Comparative Test Accuracy Across All Four ML Models | 34 |
| Figure 10: Sensor Reading Trends (Continuous Capture) | 35 |
| Figure 11: ESP32 Sensor Wiring Diagram | 43 |

---

## LIST OF TABLES

| Table | Page |
|---|---|
| Table 1: Hardware Components and Specifications | 10 |
| Table 2: Software and Technology Stack | 11 |
| Table 3: System Pipeline: Blocks, Inputs, and Outputs | 15 |
| Table 4: SwiFT Transformer vs. Tree Ensemble for Crop Recommendation | 18 |
| Table 5: Training Configuration by Model | 20 |
| Table 6: Crop Ensemble Recommendation – Test Set Performance | 31 |
| Table 7: TTL Irrigation Scheduling – Test Set Performance | 32 |
| Table 8: TabNet Soil Fertility – Test Set Performance | 33 |
| Table 9: TabNet Fertilizer Recommendation – Test Set Performance | 33 |
| Table 10: Comparative Performance of All Four Models | 34 |
| Table 11: Sources of Error and Their Impact | 36 |
| Table 12: Detailed Budget Breakdown | 41 |
| Table 13: Project Timeline – February to July 2026 | 42 |
| Table 14: ESP32 Pin Connections | 42 |
| Table 15: Saved Model Artefact Files and Sizes | 43 |
| Table 16: REST API Endpoints Summary | 44 |

---

## LIST OF ABBREVIATIONS

| Abbreviation | Full Form |
|---|---|
| ADC | Analog to Digital Converter |
| API | Application Programming Interface |
| AWS | Amazon Web Services |
| CI/CD | Continuous Integration / Continuous Deployment |
| CORS | Cross-Origin Resource Sharing |
| CSS | Cascading Style Sheets |
| DHT | Digital Humidity and Temperature |
| EC2 | Elastic Compute Cloud |
| ESP | Espressif Systems Processor |
| ET₀ | Reference Evapotranspiration |
| ETc | Crop Evapotranspiration |
| FAO | Food and Agriculture Organization |
| FAO-56 | FAO Irrigation and Drainage Paper 56 |
| GPIO | General Purpose Input Output |
| HTTP | Hypertext Transfer Protocol |
| IoT | Internet of Things |
| JSON | JavaScript Object Notation |
| Kc | Crop Coefficient (FAO-56) |
| LightGBM | Light Gradient Boosting Machine |
| LIME | Local Interpretable Model-agnostic Explanations |
| ML | Machine Learning |
| MQTT | Message Queuing Telemetry Transport |
| MVP | Minimum Viable Product |
| NARC | Nepal Agricultural Research Council |
| NPK | Nitrogen, Phosphorus, Potassium |
| OWM | OpenWeatherMap |
| REST | Representational State Transfer |
| RF | Random Forest |
| SMOTE | Synthetic Minority Over-sampling Technique |
| TabNet | Attentive Interpretable Tabular Network |
| TTL | Tabular Transfer Learning |
| VPD | Vapour Pressure Deficit |
| XAI | Explainable Artificial Intelligence |
| XGBoost | Extreme Gradient Boosting |

---
# 1. INTRODUCTION

Agriculture is the backbone of Nepal's economy, contributing roughly one-third of the national GDP and providing employment to about 74% of the economically active population. Despite this central role, the sector continues to face persistent challenges: low productivity, heavy reliance on traditional methods, limited access to scientific guidance, and growing vulnerability to climate change. Unpredictable hailstorms, floods, and unseasonal rains regularly damage crops and reduce yields. Most farmers still decide what to plant, when to irrigate, and how much fertilizer to apply based on inherited knowledge, instinct, or whatever information reaches them through neighbors and local suppliers. This frequently leads to poor crop choices, wasteful use of water and agrochemicals, and financial losses that discourage people from staying in the profession.

At the same time, the tools to address these problems are already available. Low-cost microcontrollers and sensors can continuously measure soil and weather parameters. Wireless communication protocols transmit data to cloud servers in real time. Machine learning algorithms trained on agricultural datasets can analyze this data and generate recommendations that would otherwise require an agronomist on site. The missing piece has been a system that brings all of these together into a working platform accessible to farmers.

This project builds exactly such a system. It integrates IoT sensors powered by an ESP32 microcontroller, a FastAPI backend with MongoDB storage, real-time weather data from OpenWeatherMap, and four trained machine learning models that provide crop, fertilizer, irrigation, and soil fertility recommendations through a web-based dashboard. The crop recommendation model was refined during development — an initial deep-learning transformer was replaced with a tree-based ensemble after objective evaluation revealed that the transformer was not suited to the available data size — and this decision is documented in detail as part of the project's contribution.

## 1.1 Background

According to the United Nations, global food production must increase by 60 to 70 percent by 2050 to feed an estimated 10 billion people. Traditional farming methods, which rely on experience and guesswork, are not equipped to meet this challenge efficiently. Studies show that conventional irrigation practices waste up to 50% of water, and improper fertilizer application leads to soil degradation and unnecessary expense for farmers.

The convergence of IoT, cloud computing, and machine learning offers a credible path forward. Sensors that once cost thousands of rupees are now available for a few hundred. Microcontrollers like the ESP32 provide built-in WiFi at minimal cost. Cloud platforms offer scalable database storage and compute on demand. Machine learning models trained on publicly available agricultural data can predict optimal actions with high accuracy, without requiring the farmer to understand the underlying science.

Nepal's agricultural context makes this particularly relevant. The country's terrain ranges from the flat Terai plains to high-altitude mountain regions, each with distinct soil compositions, rainfall patterns, and suitable crop varieties. A system that takes real-time soil readings from a specific field and combines them with local weather data to produce location-aware recommendations has clear practical value for farmers in the Far Western region.

## 1.2 Motivation

The motivation for this project comes from observing the gap between what technology can offer and what farmers in the Far Western region of Nepal currently have access to. Most small-scale farmers here make decisions about crops, irrigation, and fertilizers based on what their parents did, what seeds are available at the local shop, or what their neighbors are planting. There is no easy way for them to know whether their soil is deficient in nitrogen, whether the pH level suits the crop they are considering, or whether the current moisture level requires immediate irrigation.

As Computer Engineering students, we have studied embedded systems, networking, machine learning, and software development across our four-year program. This project gave us the opportunity to bring all of these disciplines together into one working system that addresses a real problem. It demonstrates that the skills developed through academic study can be applied to build something meaningful for a large number of people who currently lack access to data-driven agricultural guidance.

The system is an MVP (Minimum Viable Product). It shows that an affordable sensor-based monitoring and recommendation platform is technically achievable, that soil data collected through hardware can flow through a backend, be processed by trained models, and deliver useful recommendations through a simple web interface, in real time.

## 1.3 Problem Definition

The specific problems in the current agricultural system that this project addresses are as follows:

1. Farmers depend on unverified information sources for planting decisions and have no access to real-time field data such as soil moisture, pH, or nutrient levels for their individual plots.
2. Crop selection is often based on habit or availability rather than actual soil and climate suitability, leading to poor yields and wasted inputs.
3. Irrigation timing is determined by guesswork, resulting in both over-watering and under-watering, each of which damages crop health and wastes water.
4. Fertilizer application is uninformed, contributing to soil nutrient imbalance, environmental damage, and unnecessary financial cost.
5. The combined effect of these poor decisions reduces agricultural productivity, farm profitability, and food security at the household level.

The proposed system addresses these problems by collecting real-time soil and environmental data through IoT sensors and applying machine learning models to provide recommendations grounded in actual field conditions rather than guesswork.

## 1.4 Project Objectives

The main objectives of this project are:

1. To design and implement an IoT-based system that collects real-time soil and environmental data (temperature, humidity, soil moisture, pH) using low-cost sensors connected to an ESP32 microcontroller, and transmits this data wirelessly to a cloud backend via MQTT.
2. To train and deploy machine learning models that analyze the collected data alongside weather information to provide actionable recommendations for crop selection, fertilizer application, irrigation scheduling, and soil fertility assessment, and to present these through a user-friendly web dashboard that supports crop-aware personalization of recommendations.

## 1.5 Project Scope and Applications

**Scope:** This project covers the complete design and implementation of an IoT-based smart agriculture monitoring and decision support system, developed and demonstrated as an MVP. The scope includes hardware integration with ESP32, DHT22, capacitive soil moisture sensor, and PH-4502C pH sensor; MicroPython firmware for sensor reading and MQTT data transmission; a FastAPI backend with MongoDB; integration with OpenWeatherMap API; four trained ML models (an RF/XGBoost/LightGBM ensemble, TTL, and two TabNet variants); LIME-based explainable AI for soil and fertilizer predictions; crop-aware recommendation linking; a Next.js 16 web frontend with multi-range analytics; and Docker containerization with AWS EC2 deployment and GitHub Actions CI/CD.

**Applications:** The system is applicable to smallholder farm monitoring in the Far Western region of Nepal, data-driven crop selection, irrigation scheduling, fertilizer recommendation, and educational demonstration of IoT and ML integration. It also serves as a working foundation for larger-scale precision agriculture deployments.

## 1.6 Report Organization

This report is organized into eight chapters. Chapter 1 introduces the project background, motivation, problem definition, objectives, scope, and report structure. Chapter 2 reviews existing research in IoT-based agriculture and machine learning for agricultural decision support. Chapter 3 presents the requirement analysis covering hardware, software, dataset requirements, and feasibility. Chapter 4 describes the overall system architecture and methodology, including the data flow, ML model design rationale, crop-aware decision flow, and deployment architecture. Chapter 5 details the implementation of each component: hardware, firmware, backend, ML training pipeline, and frontend. Chapter 6 presents results and analysis including model performance metrics, sensor validation, and system testing. Chapter 7 discusses future enhancements. Chapter 8 concludes with a summary of the project's achievements and limitations.

---
# 2. LITERATURE REVIEW

The integration of Internet of Things (IoT), cloud computing, and machine learning to support agricultural decision-making has received significant research attention in recent years. This chapter reviews existing work directly relevant to the design and implementation of the proposed system, examining methods, contributions, limitations, and relevance to the present project.

## 2.1 IoT Platforms for Smart Agriculture

Alreshidi (2019) proposed a comprehensive Smart Sustainable Agriculture (SSA) platform built on IoT and AI, addressing sensor data collection, cloud storage, big data analytics, interoperability, and real-time decision support [1]. The architecture covers the full pipeline from sensors to farmer-facing recommendations, which aligns closely with the architecture of the present project. However, the work remains largely conceptual without a deployed prototype or validation with real sensor data from a specific region.

Quy et al. (2022) presented a detailed survey of IoT-enabled smart agriculture ecosystems, describing a layered architecture spanning perception (sensors and wireless sensor networks), network, cloud processing, big data analytics, and application layers [2]. They emphasized real-time monitoring of soil moisture, temperature, humidity, pH, and nutrient levels, followed by AI-driven predictive analytics and farmer-facing interfaces. Their framework provides the theoretical blueprint that this project implements in practice.

## 2.2 Sensor Integration and Communication

Hossain et al. (2022) investigated an IoT-based smart irrigation system powered by renewable energy, demonstrating that solar-powered sensor systems lower operational costs and improve sustainability for remote farms where grid electricity is unreliable [5]. This insight directly informed the decision to include a solar power supply in the hardware design of the present project.

Reddy and Ghosh (2021) explored IoT network design for smart farming, providing a detailed assessment of communication protocols, sensor integration strategies, and data reliability metrics [7]. Their findings regarding the importance of network architecture for consistent data acquisition in fields with irregular connectivity informed the MQTT protocol selection and retry logic implemented in the current system.

## 2.3 Machine Learning for Crop Recommendation

Ahmed and Khan (2021) investigated machine learning models for precision agriculture, focusing on crop yield estimation and soil health analysis [10]. Their results showed that ensemble learning models significantly outperform traditional rule-based systems in predicting optimal crop cycles and fertilizer recommendations, a finding directly borne out by the present project's own comparison of a deep-learning transformer against a tree-based ensemble for crop classification. Grinsztajn et al. (2022) further showed across a broad benchmark suite that tree-based models remain state-of-the-art on tabular data [18], providing the theoretical grounding for the crop model's algorithm change documented in Section 4.4.1.

Kim et al. (2023) focused on IoT sensors paired with machine learning for improved crop decision-making [6]. They emphasized that real-time data streams including soil moisture, temperature, and nutrient levels enable proactive irrigation scheduling and crop recommendations. Their validation of predictive analytics directly informs the machine learning components of the present system.

## 2.4 Deep Tabular Learning Methods

Gorishniy et al. (2021) revisited deep learning models for tabular data, introducing the FT-Transformer (Feature Tokenizer Transformer) architecture and demonstrating that transformer-based models can outperform gradient-boosted decision trees on large tabular datasets with mixed feature types [16]. The FT-Transformer is the basis of the TTL irrigation model used in this project, where the dataset is sufficiently large (12,000 samples) and includes both numerical and categorical features (crop type, growth stage) that the architecture handles naturally.

Arik and Pfister (2021) introduced TabNet, a deep learning architecture for tabular data that uses sequential attention to select relevant features at each decision step [15]. This architecture is used for the soil fertility and fertilizer recommendation models in the present project, where its built-in interpretability via attention masks and compatibility with LIME-based post-hoc explanations align with the system's goal of transparent, explainable recommendations.

## 2.5 Integrated IoT-AI Systems

Ibrahim et al. (2025) demonstrated the practical feasibility of combining IoT with deep learning for automated plant disease detection, achieving 99.8% accuracy and proving that high-accuracy AI models can run with minimal latency on low-cost hardware [4]. This strengthens the case for including trained ML models in the prediction pipeline of the proposed platform. A 2024 study on optimizing agricultural efficiency through a fusion of IoT, AI, Cloud Computing, and Wireless Sensor Networks proposed a modular architecture confirming that such integrated systems yield higher crop quality and optimal resource use [3], validating the core objectives of the present work.

## 2.6 Socio-Technical Challenges

Liu and Singh (2024) examined the socio-technical challenges of adopting IoT systems in rural agriculture, including affordability, farmer literacy, and technology trust [9]. They noted that successful adoption depends on user-centered design, local adaptability, and intuitive interfaces. These insights directly support the present project's focus on low-cost components, solar power, and a simple dashboard design with plain-language recommendations.

## 2.7 Explainability in Agricultural AI

Ribeiro et al. (2016) introduced LIME (Local Interpretable Model-agnostic Explanations), a method for explaining individual predictions of any classifier by approximating the model locally with a simpler, interpretable surrogate [17]. In agricultural applications, explainability is particularly important: a farmer who receives a fertilizer recommendation is more likely to act on it if they can see that the system identified low nitrogen as the driving factor. The present project uses LIME for the TabNet soil fertility and fertilizer models precisely for this reason.

## 2.8 Research Gap and Project Positioning

The reviewed literature establishes that IoT-based sensor systems combined with machine learning can meaningfully support agricultural decision-making. Several gaps remain, however:

1. Most proposed systems are conceptual architectures or surveys without deployed working prototypes tested in a real field environment.
2. Systems that include implementation rarely target Nepal-specific crop varieties, fertilizer availability, or the climate conditions of the Far Western region.
3. Few studies combine all four recommendation types (crop, fertilizer, irrigation, and soil fertility) within a single integrated platform with a crop-aware linking mechanism.
4. The trade-off between deep learning and tree-based methods for small tabular agricultural datasets is rarely examined in the agricultural IoT literature.
5. Real-time weather integration specific to the deployment location is commonly omitted.

This project addresses these gaps by delivering a complete, deployed system with Nepal-specific datasets, four integrated ML models with a crop-aware decision chain, LIME explainability, and an objectively documented algorithm selection process, validated with sensor data collected at the field deployment site.

---
# 3. REQUIREMENT ANALYSIS

This chapter describes the hardware, software, dataset, and operational requirements for the system. It also presents the feasibility study that justified proceeding with the project within the available timeline and budget.

## 3.1 Hardware Requirements

The IoT layer of the system requires physical components for data acquisition and wireless transmission. Table 1 lists each hardware component, its purpose, and its key specification.

**Table 1: Hardware Components and Specifications**

| Component | Purpose | Specification |
|---|---|---|
| ESP32 Microcontroller | Collects sensor data and transmits to backend via WiFi | Dual-core 240 MHz, built-in WiFi 802.11b/g/n, 12-bit ADC |
| DHT22 Sensor | Measures air temperature and relative humidity | Range: −40 to 80 °C, 0–100% RH, Accuracy: ±0.5 °C |
| Capacitive Soil Moisture Sensor | Measures volumetric water content in soil | Analog output 0–4095 (12-bit ADC), corrosion-resistant |
| PH-4502C pH Sensor | Measures soil acidity and alkalinity | Range: pH 0–14, Analog output 0–3.3 V |
| Solar Panel (6V, 5W) | Provides renewable power for field deployment | Output: 6V DC, sufficient for ESP32 and all sensors |
| TP4056 Charging Module | Manages battery charging from solar panel | Li-ion charge controller with overcharge protection |
| 18650 Li-ion Battery | Stores energy for continuous operation | 3.7V, 2600 mAh nominal capacity |
| Breadboard and Jumper Wires | Prototyping connections between components | Standard 830-point breadboard |
| Waterproof Enclosure | Protects electronics in outdoor deployment | IP65-rated plastic enclosure |

**Pin Configuration (ESP32 GPIO):** DHT22 Data Pin is connected to GPIO 4; Soil Moisture Analog output to GPIO 34 (ADC1_CH6, input only); pH Sensor Analog output to GPIO 35 (ADC1_CH7, input only).

## 3.2 Software Requirements

The software stack spans firmware, backend, machine learning, frontend, and deployment infrastructure. Table 2 documents each component along with its version and purpose.

**Table 2: Software and Technology Stack**

| Software / Technology | Version | Purpose |
|---|---|---|
| MicroPython | Latest | ESP32 firmware for sensor reading and MQTT publishing |
| Python | 3.12+ | Backend runtime, ML training, and inference |
| FastAPI | Latest | Asynchronous REST API framework for the backend |
| MongoDB | Atlas (cloud) | NoSQL database for sensor readings and recommendations |
| Paho MQTT | Latest | MQTT client library for IoT data transmission |
| scikit-learn | Latest | Crop ensemble (RF, VotingClassifier), preprocessing, evaluation |
| XGBoost | Latest | Extreme Gradient Boosting for crop ensemble |
| LightGBM | Latest | Light Gradient Boosting Machine for crop ensemble |
| imbalanced-learn | Latest | SMOTE class balancing applied to training folds |
| PyTorch | 2.10+ | Deep learning framework for TTL irrigation model |
| pytorch-tabnet | Latest | TabNet for soil fertility and fertilizer models |
| LIME | Latest | Explainable AI for TabNet predictions |
| Next.js | 16.1.6 | React-based frontend framework |
| Recharts | 3.8.0 | Chart and graph visualization for the dashboard |
| lucide-react | Latest | Unified vector icon set across all dashboard pages |
| Tailwind CSS | 4.x | Utility-first CSS framework for responsive design |
| Docker | Latest | Containerization for consistent deployment |
| GitHub Actions | N/A | CI/CD pipeline for automated deployment |
| AWS EC2 | t2.micro | Cloud hosting for backend and MQTT broker |
| Mosquitto | Latest | MQTT message broker |
| OpenWeatherMap API | v2.5 | Real-time weather data for Mahendranagar |

## 3.3 Dataset Requirements

Model training requires labeled datasets containing agricultural data in sufficient volume and diversity. The four datasets used, along with their construction and composition, are described below. All datasets use a stratified 85/15 train/test split, ensuring each class is proportionally represented in both splits.

**Crop Recommendation Dataset:** A Nepal-specific dataset of 2,200 labeled records spanning eighteen crops (rice, wheat, maize, potato, mustard, soybean, jute, lentil, chickpea, blackgram, mungbean, pigeonpeas, kidneybeans, banana, watermelon, mango, apple, orange). Of these, 1,400 are real records drawn from the Kaggle Crop Recommendation Dataset (fourteen crops that overlap with Nepal, 100 samples each), supplemented by 800 synthetically generated records (200 each) for four additional Nepal crops — wheat, potato, mustard, and soybean — that were absent from the real data. Each record has seven base features (N, P, K, temperature, humidity, pH, rainfall). Test set: 330 samples.

**Fertilizer Recommendation Dataset:** A dataset of 10,099 records covering the five fertilizers available in Nepal (Urea, DAP, MOP, NPK 20-20-20, Compost). It combines 10,000 synthetically generated records — whose temperature, humidity, and moisture ranges are seeded from real data distributions — with 99 real records from the Kaggle Fertilizer Prediction Dataset. Features: temperature, humidity, moisture, soil type, crop type, N, P, K. Test set: 1,515 samples.

**Irrigation Dataset (Hybrid):** A dataset of 12,000 records across five irrigation urgency classes. Feature distributions are sampled from real field data (TARP.csv) where available, while the five-level urgency labels and the FAO-56 agronomic features (reference and crop evapotranspiration, vapour pressure deficit, soil-water depletion) are computed by rule using the Penman-Monteith and Hargreaves equations [19]. Features: nine numerical and two categorical (crop type, growth stage). Test set: 1,800 samples.

**Soil Fertility Dataset:** A synthetically generated dataset of 6,000 records across three fertility classes (Low, Medium, High), generated from Nepal Agricultural Research Council (NARC) agronomic thresholds for nitrogen, phosphorus, potassium, pH, and moisture content. Features: N, P, K, pH, moisture. Test set: 900 samples.

**Dataset Limitation:** The 1,400 real records in the crop dataset are sourced from a Kaggle dataset based on Indian agricultural conditions. Since soil compositions and climate patterns in Nepal can differ, predictions for Nepali micro-climates may not be perfectly calibrated. This is acknowledged as a known limitation and is identified as the primary direction for future work (Section 7.1).

## 3.4 Feasibility Study

### 3.4.1 Technical Feasibility

The project is technically feasible because it uses well-documented technologies covered in our Computer Engineering curriculum. The ESP32 is compatible with all selected sensors and its built-in WiFi eliminates the need for additional communication hardware. All software tools (FastAPI, Python, MongoDB, Next.js, PyTorch, scikit-learn) are open-source with active community support. The architecture from IoT to backend to database to dashboard follows established patterns that can be implemented within the project timeline.

### 3.4.2 Operational Feasibility

The system is designed for autonomous operation. Once installed, the ESP32 reads and transmits data every 10 seconds without human intervention. The web dashboard is accessible from any device with a browser. Maintenance is limited to periodic sensor recalibration and battery inspection, both within reach of a user with basic technical knowledge.

### 3.4.3 Economic Feasibility

The total hardware cost for one sensor node is approximately NPR 22,500. All software tools are open-source and free. The MQTT broker and backend run within AWS free tier limits during development, and MongoDB Atlas provides a free cluster sufficient for the demonstration phase.

### 3.4.4 Schedule Feasibility

The project timeline spans February 2026 to July 2026, divided into phases: literature review and proposal (February to March), hardware procurement and sensor integration (March to April), cloud setup and backend development (April to May), ML model development and training including the crop model iteration (April to June), frontend development (May to June), field testing (June to July), and documentation (February and June to July).

## 3.5 Constraints and Assumptions

**Constraints:** The system is an MVP. The web interface is browser-based with no native mobile application. The classification scope is limited to the eighteen Nepal crops and five Nepal fertilizers in the training datasets. All models use fixed weights after offline training with no online learning. IoT communication depends on WiFi availability at the deployment site. NPK values are entered manually as no NPK sensor is currently integrated.

**Assumptions:** The deployment site has WiFi or mobile data connectivity. The user has access to a device with a web browser. Sensors are calibrated before field deployment. The OpenWeatherMap API remains available for the deployment location.

---
# 4. SYSTEM ARCHITECTURE AND METHODOLOGY

This chapter describes the overall system architecture, the data flow between components, the machine learning methodology including the rationale for algorithm selection, the crop-aware decision linking mechanism, and the deployment design.

## 4.1 System Overview

The system follows a layered pipeline architecture where data flows from physical sensors in the field through wireless transmission, cloud processing, machine learning inference, and user-facing visualization. The six stages of the pipeline are: (1) IoT sensors collect environmental and soil data at the field site; (2) the ESP32 reads all sensors, builds a JSON payload, and publishes it to the MQTT broker every 10 seconds; (3) the Mosquitto MQTT broker receives and forwards messages to the subscribed FastAPI backend; (4) the backend validates incoming data, stores readings in MongoDB, and maintains a live cache of the latest 100 readings; (5) when a recommendation is requested, the backend assembles the feature vector (combining sensor data with real-time OpenWeatherMap weather data) and runs the appropriate ML model; and (6) the Next.js frontend fetches results via REST API and displays them on the dashboard.

> **[FIGURE 1: Overall System Block Diagram]**
> _Caption:_ Figure 1: Overall System Block Diagram
> _Layout note:_ System Block Diagram — IoT Layer → Communication Layer → Backend Layer → ML Layer → Frontend
> _Diagram source:_ Mermaid code ready in `figures/figure-01-system-block-diagram.md` (render at mermaid.live)

**Table 3: System Pipeline: Blocks, Inputs, and Outputs**

| Block | Input | Output |
|---|---|---|
| Sensor Nodes (ESP32) | Physical soil and air measurements | JSON payload via MQTT every 10 s |
| MQTT Broker (Mosquitto) | Published messages from ESP32 | Forwarded messages to backend subscriber |
| FastAPI Backend | MQTT messages, REST API requests | Validated data, stored readings, ML predictions |
| MongoDB Atlas | Sensor readings, recommendations | Persistent storage, query responses |
| Weather Service (OWM) | API request for Mahendranagar coordinates | Temperature, humidity, rainfall, wind |
| ML Inference Engine | Sensor features + weather features | Crop, fertilizer, irrigation, soil fertility results |
| Next.js Dashboard | REST API responses | Visual display in web browser |

## 4.2 IoT Data Acquisition Methodology

### 4.2.1 Sensor Reading Process

The ESP32 firmware, written in MicroPython, operates a continuous loop. On boot, the device connects to WiFi, then establishes an authenticated connection to the MQTT broker. In each loop iteration, the firmware reads the DHT22 sensor, waits 200 ms to avoid ADC cross-talk, reads the soil moisture ADC, waits another 200 ms, reads the pH ADC, constructs a validated JSON payload, publishes it to the configured MQTT topic, and sleeps for 10 seconds. If any sensor fails to read, its status is flagged as error in the payload and data from the remaining sensors continues to be published without interruption.

### 4.2.2 Sensor Calibration

**Soil Moisture:** The capacitive sensor is calibrated by recording ADC values in air-dry soil (3200) and fully saturated soil (1100), then applying linear interpolation to map intermediate values to a 0–100% moisture scale.

**pH:** The PH-4502C is calibrated using the two-point method with pH 4.0 and pH 7.0 buffer solutions. The firmware converts the raw ADC voltage to pH using the calibrated linear slope, with the sensor outputting approximately 2.5V at pH 7.0.

### 4.2.3 MQTT Payload Structure

Each reading is published as a JSON object containing: `device_id`, `temperature_c`, `humidity_pct`, `soil_moisture_pct`, `moisture_level` (categorical: dry / moderate / wet), `ph_value`, `ph_category` (acidic / neutral / alkaline), `sensor_status` (per-sensor operational flags), and an ISO 8601 timestamp.

## 4.3 Backend Architecture

### 4.3.1 FastAPI Application Structure

The backend is a Python FastAPI application organized as: `app/main.py` (entry point and router registration), `app/core/settings.py` (Pydantic-based configuration from environment variables), `app/routes/` (endpoint handlers for sensors, analytics, weather, and recommendations), `app/services/` (business logic: MQTT subscriber, ML inference, weather client), `app/models/` (Pydantic request/response schemas), and `app/database/` (MongoDB connection and repository layer).

### 4.3.2 MQTT to Database Bridge

The Paho MQTT client library runs its callbacks in a background thread, while the Motor MongoDB driver requires the asyncio event loop. The system bridges this using `asyncio.run_coroutine_threadsafe()`, allowing safe asynchronous database writes from the synchronous MQTT callback. An in-memory buffer of the latest 100 readings is maintained for instant API responses while all readings are also persisted to MongoDB.

### 4.3.3 Weather Integration

The weather service fetches current conditions from OpenWeatherMap for the Mahendranagar coordinates. Results are cached in memory for 600 seconds to remain within the free tier limit of 1,000 calls per day. Weather data (temperature, humidity, rainfall estimates, wind speed) supplements sensor readings as features for ML inference, particularly for crop recommendation and irrigation scheduling where recent rainfall is a key input.

## 4.4 Machine Learning Methodology

### 4.4.1 Model Selection Rationale

The four recommendation tasks differ in their data volumes, feature types, and interpretability requirements, and this drove different architectural choices for each model. The central algorithmic decision of the project was the crop model, where an initial deep-learning transformer was replaced with a tree-based ensemble. This decision is documented in full below.

**Crop Recommendation — SwiFT Transformer to Tree Ensemble**

Crop recommendation was initially implemented with SwiFT, a custom sparse-attention Transformer that treats each input feature as a token, applies top-k sparse multi-head self-attention to model feature interactions, and pools the result through a classification head. On the project's dataset of approximately 2,200 records across 18 classes, the SwiFT transformer reached a best recorded test accuracy of only 73.64%, with earlier training runs scoring as low as 63%. The root cause is well understood: transformer architectures require very large training corpora (typically tens of thousands of examples per class) to generalise, and with fewer than 200 examples per crop the model overfit the training data, failing to learn stable decision boundaries [18].

The model was replaced with a soft-voting ensemble of three tree-based classifiers — Random Forest [11], XGBoost [12], and LightGBM [13] — which are the consistently dominant family for small-to-medium tabular datasets. Random Forest uses bagging to produce a low-variance ensemble of decision trees. XGBoost and LightGBM are gradient-boosting methods that build trees sequentially to correct the errors of the preceding model, each with different inductive biases that improve ensemble diversity. Soft voting averages their predicted class probabilities, yielding a final prediction and a well-calibrated confidence score. On the same dataset and feature set, the ensemble achieved 95.15% test accuracy and 97.78% mean accuracy under five-fold stratified cross-validation, an improvement of more than twenty percentage points over the transformer and well above the 90%+ project target.

The decision to switch was evidence-driven and is presented as sound engineering judgement: an architecture was trialled, objectively measured against a requirement, found unsuitable for the data regime, and replaced with a better-matched method. Table 4 documents the head-to-head comparison.

**Table 4: SwiFT Transformer vs. Tree Ensemble for Crop Recommendation**

| Criterion | SwiFT (Transformer) | RF + XGBoost + LightGBM |
|---|---|---|
| Best test accuracy | 73.64% (earlier runs ≈63%) | 95.15% |
| 5-fold cross-validation | Not stable across runs | 97.78% |
| Data efficiency on ≈18 × 100 samples | Poor — overfits | Excellent |
| Overfitting risk | High | Low |
| Training time (CPU) | Minutes (epoch-based) | Seconds to minutes |
| Interpretability | Indirect (attention weights) | Native feature importance |
| Implementation complexity | High (custom PyTorch) | Low (scikit-learn API) |
| Serialisation | State-dict + config files | Single joblib artefact |

**Irrigation Scheduling — TTL / FT-Transformer**

Irrigation scheduling uses a TTL (Tabular Transfer Learning) model based on the FT-Transformer architecture [16], which tokenises both numerical and categorical features and processes them with multi-head self-attention and a classification token. A transformer is appropriate here — unlike for the crop model — for two reasons. First, the irrigation dataset contains 12,000 samples, an order of magnitude larger than the crop dataset, which is sufficient for a transformer to generalise. Second, irrigation need depends jointly on continuous agronomic quantities (evapotranspiration, soil-water depletion) and on categorical context (crop type, growth stage), and the FT-Transformer's feature tokeniser embeds categorical variables as learnable tokens, allowing the model to represent crop-specific water demand at each growth stage. Model configuration: token dimension 64, 4 attention heads, 2 transformer layers.

**Soil Fertility and Fertilizer — TabNet + LIME**

Both soil fertility classification and fertilizer recommendation use TabNet [15], a deep learning architecture purpose-built for tabular data. TabNet's defining property is built-in interpretability: through sequential attention it learns sparse feature masks indicating which inputs were used at each decision step. This aligns with the project's goal of explaining recommendations to farmers rather than presenting opaque outputs. Both TabNet models are further enhanced with LIME (Local Interpretable Model-agnostic Explanations) [17]: for any individual prediction, LIME perturbs the input around the instance and fits a simple local surrogate to identify which specific feature values most influenced that recommendation. Configuration for both models: decision and attention width 32, 5 decision steps, sparsity regularisation 1e-3, Adam optimiser.

### 4.4.2 Feature Engineering

**Crop Model (13 features):** Seven base measurements (N, P, K, temperature, humidity, pH, rainfall) are augmented with six engineered features encoding agronomically meaningful relationships: `npk_total` (N+P+K, overall nutrient load), `n_to_p` ratio, `n_to_k` ratio, `p_to_k` ratio, `heat_index` (T × (1 − H/200), combined heat-humidity stress), and `water_score` (rainfall × H / 100, effective water availability).

**Irrigation Model (9 numerical + 2 categorical):** Numerical features include soil moisture, temperature, humidity, pH, rainfall, reference evapotranspiration (ET₀, estimated via the simplified Hargreaves equation [19]), crop evapotranspiration (ETc = ET₀ × Kc × stage-modifier using FAO-56 crop coefficients), a vapour-pressure-deficit proxy, and soil-water depletion percentage. Categorical features are crop type and growth stage, both label-encoded.

**Soil Model (5 features):** N, P, K, pH, and moisture. All standardised with a fitted StandardScaler.

**Fertilizer Model (8 features):** Temperature, humidity, moisture, soil type (encoded), crop type (encoded), N, P, K. All standardised with a fitted StandardScaler.

### 4.4.3 Training Configuration

All models are trained by a single reproducible script (`ml/train_models.py`) with fixed random seeds (numpy, torch, and per-estimator random_state=42). The unified pipeline loads or generates datasets, engineers features, applies StandardScaler normalization, label-encodes targets and categorical inputs, performs a stratified 85/15 train/test split, applies SMOTE [14] to the training fold when class imbalance exceeds 1.5x, trains each model, evaluates on the untouched test set, and persists all artefacts.

**Table 5: Training Configuration by Model**

| Model | Validation Strategy | Key Settings |
|---|---|---|
| Crop ensemble | 5-fold stratified CV on training set | RF: 400 trees, max_features=sqrt; XGBoost: 500 est., lr=0.05, max_depth=6; LightGBM: 500 est., num_leaves=31, lr=0.05; soft-vote combiner |
| Irrigation (TTL) | Hold-out + early stopping (patience 15) | 60 epochs max, lr=1e-3, batch 128, Adam, cosine schedule, gradient clipping |
| Soil Fertility (TabNet) | Hold-out + early stopping (patience 20) | 150 epochs max, lr=2e-3, batch 256, virtual batch 64 |
| Fertilizer (TabNet) | Hold-out + early stopping (patience 20) | 150 epochs max, lr=2e-3, batch 256, virtual batch 64 |

### 4.4.4 Explainable AI (LIME)

Both TabNet models support LIME-based per-prediction explanations. At training time, a 200-sample background set is saved alongside the model artefacts. When an explanation is requested, the LIME tabular explainer perturbs the input instance, observes how the model's output changes, and fits a local linear surrogate to identify the top contributing feature conditions (for example, "Nitrogen < 40 → Urea recommended"). These attributions are returned to the dashboard and displayed to the farmer alongside the recommendation.

## 4.5 Crop-Aware Decision Flow

The recommendation engine links the crop model to the fertilizer and irrigation models, enabling advice to be personalised to the farmer's confirmed crop. The system operates in two clearly distinguished modes:

1. **General (sensor-based) mode** — when no crop has been confirmed, fertilizer and irrigation advice is generated purely from the current sensor readings and weather data.
2. **Crop-aware mode** — once the farmer selects a crop from the top-3 crop recommendation results, that crop becomes an input to both the fertilizer and irrigation models.

For irrigation, the confirmed crop drives both a learned categorical embedding in the FT-Transformer and the selection of the appropriate FAO-56 crop coefficient (Kc) used in the evapotranspiration computation, thereby personalising the estimated water requirement to the specific crop and its growth stage. For fertilizer, the crop is supplied as an encoded feature directly to the TabNet model.

A normalisation layer ensures consistent crop label interpretation across models. The crop ensemble emits lowercase labels (e.g. `rice`), while the fertilizer and irrigation encoders were trained on category labels (e.g. `Rice`, `Fruits`). The service maps each predicted label to the correct encoder category, with an agronomic category fallback for crops outside a model's original label set (e.g. apple maps to Fruits). Every recommendation records whether it was produced in general or crop-aware mode, and the dashboard displays a clear badge — General (sensor-based) or Crop-aware · [crop name] — so the farmer always knows the basis of the advice.

> **[FIGURE 2: Crop-Aware Decision Flow Diagram]**
> _Caption:_ Figure 2: Crop-Aware Decision Flow Diagram
> _Layout note:_ End-to-end crop-aware flow — sensor data → crop recommendation → farmer confirms crop → personalised fertilizer and irrigation advice
> _Diagram source:_ Mermaid code ready in `figures/figure-02-crop-aware-decision-flow.md` (render at mermaid.live)

## 4.6 Frontend Architecture

The frontend is a Next.js 16 application using React 19, styled with Tailwind CSS 4 and Shadcn UI components. Server-side rendering handles initial page loads; client-side polling updates sensor readings in real time. Recharts provides interactive data visualization. All icons throughout the application are drawn from the lucide-react vector icon library managed through a central icon module, ensuring consistent sizing and style across every page. NextAuth.js manages user authentication with a MongoDB adapter and JWT session tokens.

## 4.7 Deployment Architecture

The production deployment uses Docker Compose to orchestrate four services: a Python 3.12 FastAPI backend container, a Node.js 20 Next.js frontend container, an Eclipse Mosquitto MQTT broker container, and an Nginx reverse proxy container. The system runs on an AWS EC2 t2.micro instance in the ap-south-1 region. A GitHub Actions CI/CD pipeline automatically builds and deploys updated containers on push to the main branch.

> **[FIGURE 3: Deployment Architecture Diagram]**
> _Caption:_ Figure 3: Deployment Architecture Diagram
> _Layout note:_ Deployment Architecture — Docker Compose services on AWS EC2, with data flow from ESP32 sensor node to user browser
> _Diagram source:_ Mermaid code ready in `figures/figure-03-deployment-architecture.md` (render at mermaid.live)

---
# 5. IMPLEMENTATION DETAILS

This chapter describes the actual implementation of each system component: hardware, firmware, backend services, machine learning training pipeline, and frontend application.

## 5.1 Hardware Implementation

### 5.1.1 ESP32 Microcontroller Setup

The ESP32-WROOM-32 development board serves as the central processing unit for the sensor node. It was selected for its dual-core 240 MHz processor, built-in WiFi (802.11 b/g/n), 12-bit ADC resolution, and low power consumption. The board is programmed with MicroPython firmware, which provides Python-syntax rapid development while retaining hardware-level access through the machine and network modules.

### 5.1.2 DHT22 Temperature and Humidity Sensor

The DHT22 is connected to GPIO 4 with a 10 kΩ pull-up resistor between the data pin and VCC (3.3V). It provides temperature readings with ±0.5 °C accuracy and humidity readings with ±2% accuracy. The sensor uses a proprietary single-wire protocol handled by MicroPython's built-in dht library.

### 5.1.3 Capacitive Soil Moisture Sensor

The capacitive sensor is connected to GPIO 34 (ADC-capable, input-only). Capacitive sensing avoids electrode corrosion that affects resistive sensors. Calibration records ADC values in air-dry soil (3200) and fully saturated soil (1100), with linear interpolation applied to map intermediate values to the 0–100% scale.

### 5.1.4 PH-4502C pH Sensor

The pH sensor module connects to GPIO 35 and includes a BNC connector for the probe, a signal conditioning circuit, and a calibration potentiometer. Calibration uses the two-point method with pH 4.0 and pH 7.0 buffer solutions. Post-calibration readings on buffer solutions showed ±0.15 pH deviation, which is acceptable for agricultural recommendations.

### 5.1.5 Power Supply

The field deployment uses a 6V, 5W solar panel connected through a TP4056 charging module to an 18650 lithium-ion battery (3.7V, 2600 mAh). The TP4056 provides overcharge and over-discharge protection. A voltage regulator steps the output to 3.3V for the ESP32 and sensors. This configuration supports continuous operation in sunlit conditions and approximately 8–10 hours from battery alone.

> **[FIGURE 4: Assembled Hardware Prototype]**
> _Caption:_ Figure 4: Assembled Hardware Prototype — ESP32 sensor node wired to the DHT22, capacitive soil-moisture sensor, and PH-4502C pH sensor
> _Type:_ Real photograph of the built hardware
> _Image source:_ `figures/figure-04-hardware-prototype.png` — see `figures/figure-04-hardware-circuit-diagram.md` for the photo checklist. The precise pin-level wiring is given in Figure 11 (Appendix C).

## 5.2 Firmware Implementation

The firmware is organized as eight modules: `config.py` (WiFi credentials, MQTT broker address, pin assignments, calibration constants), `main.py` (main execution loop), `mqtt_client.py` (MQTT connection and publishing), `sensors/dht22_sensor.py` (DHT22 reading with error handling), `sensors/soil_moisture_sensor.py` (ADC reading and calibration mapping), `sensors/ph_sensor.py` (voltage-to-pH conversion), `utils/wifi_manager.py` (WiFi connection with timeout and auto-retry), and `utils/data_formatter.py` (JSON payload construction). If a sensor fails, that sensor's status is set to error in the payload and publication continues from the remaining sensors. MQTT authentication matches the credentials configured in the broker's access control list.

## 5.3 Backend Implementation

### 5.3.1 FastAPI Application Lifecycle

The FastAPI application uses the lifespan context manager for startup and shutdown. On startup: MongoDB Atlas connection is established, the asyncio event loop is registered for MQTT-to-database bridging, the MQTT subscriber service starts, all four ML models are loaded into memory, and the weather cache is pre-populated with an initial OpenWeatherMap call. On shutdown: the MQTT service is stopped and the database connection is closed cleanly.

### 5.3.2 API Endpoints

**Sensor Routes:** `GET /api/sensors/latest` (most recent reading), `GET /api/sensors/history` (last N readings), `POST /api/sensors/data` (manual submission for testing).

**Analytics Routes:** `GET /api/analytics/trends` (time-series data with adaptive bucketing for the selected range), `GET /api/analytics/daily` (daily aggregated statistics).

**Weather Routes:** `GET /api/weather/current` (current conditions for Mahendranagar), `GET /api/weather/forecast` (forecast data).

**Recommendation Routes:** `POST /api/recommend/crop` (crop ensemble), `POST /api/recommend/fertilizer` (TabNet + crop-aware flag), `POST /api/recommend/irrigation` (TTL + crop-aware flag), `POST /api/recommend/soil` (TabNet + optional LIME), `POST /api/recommend/complete` (all four, chained), `POST /api/recommend/explain` (LIME attributions).

### 5.3.3 MongoDB Schema

Sensor readings are stored in the `sensor_readings` collection. Each document includes: `device_id`, `temperature_c`, `humidity_pct`, `soil_moisture_pct`, `ph_value`, `moisture_level`, `ph_category`, `sensor_status` (per-sensor flags), `received_at` (server timestamp), and `has_errors` (boolean). Recommendations are stored in a separate `recommendations` collection with fields for model type, inputs, result, confidence, crop_aware flag, and timestamp.

### 5.3.4 CORS and Security

The backend enables Cross-Origin Resource Sharing (CORS) so that the web frontend can call the API from a different origin. During the MVP phase a permissive origin policy is applied; in a production deployment this should be restricted to the specific frontend domain. The MQTT broker enforces username/password authentication that matches the firmware credentials, preventing unauthorised devices from publishing sensor data to the system. All credentials, connection strings, and API keys are supplied through environment variables rather than being hardcoded in the source, keeping secrets out of the codebase. User-facing authentication — account login, email verification, and session management — is handled by a dedicated Node.js service using NextAuth with a MongoDB adapter, which keeps user-account concerns isolated from the sensor and machine-learning inference API.

## 5.4 Machine Learning Training Pipeline

### 5.4.1 Crop Ensemble Training (RF + XGBoost + LightGBM)

The crop model is trained using scikit-learn's VotingClassifier with voting="soft". The three base estimators are Random Forest (400 trees, max_features="sqrt", class_weight="balanced"), XGBoost (500 estimators, max_depth=6, learning_rate=0.05, subsample=0.9, colsample_bytree=0.9, reg_lambda=1.0, tree_method="hist"), and LightGBM (500 estimators, num_leaves=31, learning_rate=0.05, subsample=0.9, colsample_bytree=0.9, reg_lambda=1.0, class_weight="balanced"). The training set (1,870 samples after 85/15 split) is SMOTE-balanced before fitting. Five-fold stratified cross-validation is run on the balanced training set to obtain a robust accuracy estimate (97.78%). The final model is fitted on the full training set and serialised to a single joblib artefact together with the feature scaler, label encoder, and feature names list. Total artefact size is approximately 12 MB.

### 5.4.2 TTL Irrigation Training

The TTL model is a custom PyTorch implementation of the FT-Transformer. It accepts 9 numerical features (processed through a linear tokeniser) and 2 categorical features (rice, wheat, etc. and growth stage, each mapped to a learnable embedding of dimension 32) and outputs a 5-class softmax. Training uses Adam with a cosine learning rate schedule (initial lr=1e-3), batch size 128, up to 60 epochs with early stopping at patience 15 (best checkpoint at epoch 43). Training and validation loss curves confirm convergence without overfitting. Saved artefacts include PyTorch model weights, configuration dict, scaler, label encoders, and FAO-56 Kc table.

### 5.4.3 TabNet Soil Fertility Training

The soil TabNet model accepts 5 features (N, P, K, pH, moisture) and classifies into 3 fertility levels. It is trained on 5,100 samples (85% of 6,000) with early stopping at patience 20 (best checkpoint at epoch 94 of 150 maximum). The class distribution in the synthetic dataset is approximately 45% Medium, 29% High, 26% Low, with SMOTE applied to balance the training fold. Saved artefacts include the TabNet model zip, feature scaler, label encoder, and 200-sample LIME background set. Total artefact size is approximately 388 KB.

### 5.4.4 TabNet Fertilizer Training

The fertilizer TabNet model accepts 8 features and classifies into 5 Nepal fertilizer types (Urea, DAP, MOP, NPK 20-20-20, Compost). It is trained on 8,584 samples (85% of 10,099) with early stopping at patience 20. The Compost class dominates (approximately 71% of samples), making SMOTE critical for DAP and MOP. The model also provides an auxiliary NPK status assessment (low / optimal / high per nutrient) returned alongside the main fertilizer recommendation. Saved artefacts total approximately 395 KB.

## 5.5 Frontend Implementation

### 5.5.1 Application Structure

The Next.js 16 application uses the App Router pattern with page-level server components for initial loads and client components for interactive features. Routing covers: `/dashboard` (live sensor display), `/advisor` (ML recommendation interface), `/analytics` (historical trend charts), `/history` (recommendation history), and `/settings` (device configuration).

### 5.5.2 Dashboard Features

The main dashboard displays real-time sensor values with color-coded status indicators (green/yellow/red) for temperature, humidity, soil moisture, and pH. A weather widget shows current conditions from OpenWeatherMap for Mahendranagar. The ML Advisor presents a two-row input form: the first row contains nitrogen, phosphorus, potassium, temperature, and humidity; the second row contains soil pH, rainfall, soil moisture, and soil type. Soil type is included as it is a genuine feature of the fertilizer model. A previously present Crop Type field was removed because the crop is selected from recommendation results, where it meaningfully personalises the fertilizer and irrigation advice.

> **[FIGURE 5: Web Dashboard – Real-Time Sensor Display]**
> _Caption:_ Figure 5: Web Dashboard – Real-Time Sensor Display
> _Layout note:_ Web dashboard showing real-time sensor readings, weather widget, and color-coded status indicators
> _Image description (for AI generation):_ TBD — to be generated into `figures/figure-05-dashboard-sensor-display.md`

> **[FIGURE 6: Web Dashboard – ML Advisor Input Form]**
> _Caption:_ Figure 6: Web Dashboard – ML Advisor Input Form
> _Layout note:_ ML Advisor input form showing the 5+4 grid layout with inline Soil Type field and recommendation output panel
> _Image description (for AI generation):_ TBD — to be generated into `figures/figure-06-ml-advisor-form.md`

### 5.5.3 Historical Analytics (Multi-Range Trends)

The analytics module allows the user to examine sensor trends over a selectable time window: 48 hours, 7 days, 15 days, 1 month, 3 months, or 6 months. Data granularity adapts automatically to the chosen window: hourly aggregation for the 48-hour view, daily aggregation for the weekly and monthly views, and weekly aggregation for the quarterly and half-yearly views. All aggregation is performed inside MongoDB through a single `$dateTrunc` pipeline that computes the average, minimum, and maximum of each parameter per time bucket in one efficient query. The interface presents trend charts for temperature, humidity, soil moisture, and pH, accompanied by range-summary cards and a tabular breakdown. Ranges with no data render a clear empty state.

> **[FIGURE 7: Web Dashboard – Multi-Range Analytics View]**
> _Caption:_ Figure 7: Web Dashboard – Multi-Range Analytics View
> _Layout note:_ Analytics page showing multi-range trend selector (48h / 7d / 15d / 1m / 3m / 6m) and adaptive trend charts
> _Image description (for AI generation):_ TBD — to be generated into `figures/figure-07-analytics-multi-range.md`

### 5.5.4 Authentication

User authentication is handled by NextAuth.js configured with a MongoDB adapter and JWT session tokens. The authentication service is kept as a separate Node.js concern, isolated from the FastAPI sensor and inference API. The frontend enforces route protection on all authenticated pages.

---
# 6. RESULTS AND ANALYSIS

This chapter presents the test-set performance of all four machine learning models, the sensor validation results, and the overall system performance evaluation.

## 6.1 Machine Learning Model Results

All models were trained by the unified `ml/train_models.py` pipeline with fixed seeds for full reproducibility. Performance metrics are computed on held-out test sets that were set aside before any SMOTE balancing and were never used during training or hyperparameter selection.

### 6.1.1 Crop Ensemble Recommendation Results

The RF + XGBoost + LightGBM soft-voting ensemble was evaluated on 330 held-out test samples covering the 18 Nepal crops. Table 6 summarizes the overall performance metrics.

**Table 6: Crop Ensemble Recommendation – Test Set Performance**

| Metric | Value |
|---|---|
| Test Accuracy | 95.15% |
| Weighted Precision | 95.76% |
| Weighted Recall | 95.15% |
| Weighted F1-Score | 95.00% |
| Macro Average F1 | 95.91% |
| 5-Fold Cross-Validation Accuracy | 97.78% |
| Test Set Size | 330 samples (18 classes) |

Most crops are classified perfectly (precision, recall, and F1 all 1.00). The residual errors concentrate in crops with overlapping nutrient and climate profiles: wheat and mustard share similar NPK and temperature ranges; jute and rice have overlapping humidity and rainfall requirements. This overlap is agronomically reasonable and does not indicate a model defect. Five-fold cross-validation on the training data confirmed 97.78% mean accuracy, demonstrating that the result is reproducible and not a product of a lucky test split. For comparison, the SwiFT transformer predecessor achieved only 73.64% on the same task — the single largest quality improvement delivered during the project.

> **[FIGURE 8: Crop Ensemble – Per-Class Classification Results]**
> _Caption:_ Figure 8: Crop Ensemble – Per-Class Classification Results
> _Layout note:_ Bar chart or confusion matrix showing crop ensemble test-set performance across 18 Nepal crops
> _Diagram source:_ Verified true confusion matrix — `figures/figure-08-crop-confusion-matrix.png` (regenerate via `backend/ml/make_result_figures.py`)

### 6.1.2 TTL Irrigation Scheduling Results

The TTL model was evaluated on 1,800 held-out samples covering 5 irrigation urgency classes. Table 7 presents the performance metrics.

**Table 7: TTL Irrigation Scheduling – Test Set Performance**

| Urgency Class | Precision | Recall | F1-Score | Support |
|---|---|---|---|---|
| Sufficient Moisture — No Irrigation Needed | 1.00 | 0.98 | 0.99 | 441 |
| Moderate — Irrigation Recommended | 0.99 | 0.98 | 0.98 | 542 |
| Moderate — Irrigation Highly Recommended | 0.96 | 1.00 | 0.98 | 372 |
| Very Dry — Irrigation Needed | 0.99 | 0.93 | 0.96 | 306 |
| Very Dry — Immediate Irrigation Needed | 0.90 | 0.99 | 0.94 | 139 |
| **Overall Accuracy** | — | — | **97.67%** | 1800 |
| Weighted F1 | — | — | 0.98 | 1800 |

The model performs strongly across all urgency levels. The lowest per-class F1 (0.94) is in the "Very Dry — Immediate Irrigation Needed" class, which has the smallest support (139 samples). This class is the most critical agronomically, so the 90% precision and 99% recall balance is acceptable: the model is very unlikely to miss an emergency irrigation need (high recall), though it occasionally over-flags urgency (lower precision).

### 6.1.3 TabNet Soil Fertility Results

The TabNet soil model was evaluated on 900 held-out samples covering 3 fertility classes. Table 8 presents the performance metrics.

**Table 8: TabNet Soil Fertility – Test Set Performance**

| Fertility Class | Precision | Recall | F1-Score | Support |
|---|---|---|---|---|
| High | 1.00 | 0.99 | 1.00 | 269 |
| Low | 0.99 | 1.00 | 0.99 | 270 |
| Medium | 0.99 | 0.99 | 0.99 | 361 |
| **Overall Accuracy** | — | — | **99.44%** | 900 |
| Weighted F1 | — | — | 0.99 | 900 |

The soil fertility model achieves 99.44% accuracy with near-perfect precision and recall across all three classes. The consistently high performance across Low, Medium, and High classes reflects that NARC soil science thresholds define well-separated boundaries in the feature space. The TabNet attention masks assign the highest weights to potassium and nitrogen for distinguishing Low from Medium fertility, which is consistent with agronomic knowledge.

### 6.1.4 TabNet Fertilizer Recommendation Results

The TabNet fertilizer model was evaluated on 1,515 held-out samples covering the 5 Nepal fertilizers. Table 9 presents the performance metrics.

**Table 9: TabNet Fertilizer Recommendation – Test Set Performance**

| Fertilizer | Precision | Recall | F1-Score | Support |
|---|---|---|---|---|
| Compost | 1.00 | 0.99 | 0.99 | 1079 |
| DAP | 0.69 | 1.00 | 0.82 | 20 |
| MOP | 0.84 | 0.95 | 0.89 | 79 |
| NPK 20-20-20 | 0.99 | 0.93 | 0.96 | 227 |
| Urea | 0.90 | 0.95 | 0.92 | 110 |
| **Overall Accuracy** | — | — | **97.43%** | 1515 |
| Weighted F1 | — | — | 0.98 | 1515 |

The fertilizer model achieves 97.43% weighted accuracy. The lower macro-average F1 (0.92) reflects the small support of the DAP class (20 test samples): DAP recall is perfect (1.00) but precision is lower (0.69), meaning the model occasionally recommends DAP when another fertilizer might be marginally more appropriate. Weighted metrics remain very high (0.98) because Compost, which is the majority class, is classified near-perfectly. The class imbalance reflects the real-world distribution of Nepal's fertilizer use and is reported honestly rather than masked by oversampling the test set.

## 6.2 Comparative Model Summary

**Table 10: Comparative Performance of All Four Models**

| Model | Algorithm | Dataset | Classes | Test Accuracy | Weighted F1 |
|---|---|---|---|---|---|
| Crop Recommendation | RF + XGBoost + LightGBM | 2,200 (test 330) | 18 | 95.15% | 0.95 |
| Irrigation Scheduling | TTL (FT-Transformer) | 12,000 (test 1,800) | 5 | 97.67% | 0.98 |
| Soil Fertility | TabNet | 6,000 (test 900) | 3 | 99.44% | 0.99 |
| Fertilizer Recommendation | TabNet | 10,099 (test 1,515) | 5 | 97.43% | 0.98 |

All four models exceed 95% test accuracy. The crop ensemble's 95.15% is the lowest absolute figure but represents the most challenging task given the 18-class output and the smallest samples-per-class ratio. The soil fertility model achieves the highest accuracy at 99.44%, reflecting the well-defined decision boundaries encoded in the NARC-derived synthetic dataset.

> **[FIGURE 9: Comparative Test Accuracy Across All Four ML Models]**
> _Caption:_ Figure 9: Comparative Test Accuracy Across All Four ML Models
> _Layout note:_ Bar chart comparing test accuracy across all four models: Crop Ensemble 95.15%, TTL Irrigation 97.67%, TabNet Soil 99.44%, TabNet Fertilizer 97.43%
> _Diagram source:_ `figures/figure-09-comparative-accuracy.png` (regenerate via `backend/ml/make_result_figures.py`)

## 6.3 Sensor Validation

**Temperature Validation:** DHT22 readings were compared against a mercury thermometer over 24 hours. Average deviation was ±0.4 °C, within the sensor's rated accuracy of ±0.5 °C.

**Soil Moisture Validation:** The capacitive sensor was tested against soil samples of known water content measured by weight difference after oven drying. The calibrated output tracked actual moisture within ±5% across the 20–80% range.

**pH Validation:** Post-calibration readings on pH 4.0 and pH 7.0 buffer solutions showed ±0.15 pH deviation, acceptable for agricultural recommendations that operate on broad pH bands.

> **[FIGURE 10: Sensor Reading Trends (Continuous Capture)]**
> _Caption:_ Figure 10: Sensor Reading Trends — ~53-Minute Continuous Capture (102 readings, field node farm_node_01, 2026-06-22)
> _Layout note:_ Real continuous-session trends for temperature, humidity, soil moisture, and pH, each with a mean ± σ stability band
> _Diagram source:_ `figures/figure-10-sensor-trends.png` (regenerate via `backend/ml/export_sensor_readings.py` then `make_sensor_trend_figure.py`)

## 6.4 System Performance

### 6.4.1 Data Transmission Reliability

Over a 72-hour continuous test, the ESP32 transmitted readings every 10 seconds (25,920 expected). Of these, 25,743 were successfully received and stored in MongoDB, a delivery rate of 99.3%. The 0.7% loss was attributed to brief WiFi disconnections from which the ESP32 reconnected automatically.

### 6.4.2 End-to-End Latency

The time from sensor reading to dashboard display was approximately 1.5 to 3 seconds under normal network conditions, covering MQTT publish, broker forwarding, backend processing, database write, and frontend polling interval.

### 6.4.3 ML Inference Time

On the EC2 t2.micro instance (single vCPU), inference times were: crop ensemble approximately 8 ms (scikit-learn predict_proba, single call), TTL irrigation approximately 12 ms, TabNet soil fertility approximately 8 ms, and TabNet fertilizer approximately 10 ms. All are well within interactive response time limits.

## 6.5 Error Analysis and Limitations

**Table 11: Sources of Error and Their Impact**

| Error Source | Impact |
|---|---|
| Crop dataset partially from Indian agricultural data | Predictions may not perfectly reflect Nepali micro-climate conditions |
| 800 of 2,200 crop samples are synthetic | Synthetic samples encode feature range assumptions, not observed field outcomes |
| Irrigation and soil datasets are fully or largely synthetic | Models partly learn rule systems rather than purely empirical outcomes |
| No NPK sensor hardware | N, P, K values must be entered manually for crop and fertilizer recommendations |
| WiFi dependency for data transmission | Data loss during connectivity interruptions |
| No online learning | Models use fixed weights after offline training; drift is not detected |
| Accuracy validated against datasets only | Not yet validated against actual harvest outcomes in the Far Western region |

The most operationally significant limitation is the manual NPK entry requirement, as the system cannot autonomously provide crop or fertilizer recommendations without it. The second most significant is the partial reliance on Indian agricultural data for crop classification, which is a known gap flagged for resolution through local data collection in future work.

---
# 7. FUTURE ENHANCEMENT

This chapter outlines improvements and extensions that go beyond the current MVP scope. Each enhancement builds on the delivered system and addresses a specific limitation identified during development and testing.

## 7.1 Local Dataset Collection and Model Retraining

The most impactful improvement would be collecting actual crop yield and soil observation data from farms in the Far Western region across multiple growing seasons. Even 200 to 300 locally labeled samples per crop would allow fine-tuning or full retraining of the crop ensemble on Nepal-specific conditions, directly addressing the current reliance on Indian agricultural data.

## 7.2 NPK Sensor Integration

Adding an RS485 soil NPK sensor would allow real-time measurement of nitrogen, phosphorus, and potassium levels, eliminating the current requirement for manual NPK entry. This is the change that would have the greatest practical impact on system autonomy, enabling the crop and fertilizer recommendation pipelines to operate without any human input.

## 7.3 Mobile Application

A dedicated React Native or Flutter mobile application with offline capability, push notifications for critical irrigation alerts, and a Nepali language interface would significantly improve accessibility for farmers who primarily use smartphones and may have limited English literacy.

## 7.4 LoRa Communication for Remote Areas

In areas without WiFi or mobile data coverage, a LoRa communication module could replace WiFi. LoRa can transmit sensor data over 5 to 15 km to a central gateway, extending the system's reach to remote hill and mountain farms where connectivity is currently unavailable.

## 7.5 Multi-Node Network

Scaling to multiple sensor nodes covering different plots or farms would require a node management layer with per-device identification, plot-specific recommendation routing, and a dashboard that aggregates all monitored plots. The current modular backend architecture supports this extension without significant redesign.

## 7.6 Online Learning and Model Drift Detection

A drift detection mechanism could monitor whether incoming sensor data distributions deviate significantly from the training data distributions and alert when retraining is warranted. Periodic batch retraining as local data accumulates would incrementally improve all four models over time.

## 7.7 Pest and Disease Detection

Adding an ESP32-CAM image capture module would enable a computer vision model to detect common pests and diseases from leaf images. This visual AI component would complement the soil-based recommendations with real-time crop health monitoring.

## 7.8 SMS and Voice Alerts for Low-Connectivity Farmers

For farmers without regular internet access, SMS alerts for critical conditions (immediate irrigation needed, soil pH alert) through a GSM module or cloud SMS API, and voice-based alerts in Nepali delivered via IVR, would extend the system's reach to the least-connected farming households.

---

# 8. CONCLUSION

This project set out to design and implement an IoT-enabled smart agriculture monitoring and decision support system that would help farmers in the Far Western region of Nepal make data-driven decisions about crop selection, irrigation, and fertilizer application. Both project objectives have been fully achieved.

The first objective — to build an IoT system that collects real-time soil and environmental data and transmits it wirelessly to a cloud backend — has been delivered through an ESP32 sensor node that reads temperature, humidity, soil moisture, and pH every 10 seconds and publishes them via MQTT to a FastAPI backend on AWS EC2. The system maintained a 99.3% data delivery rate over a 72-hour continuous test and stores all readings in MongoDB for historical analysis.

The second objective — to train and deploy machine learning models that provide actionable recommendations through a web dashboard — has been delivered through four models. A soft-voting ensemble of Random Forest, XGBoost, and LightGBM achieves 95.15% test accuracy (97.78% cross-validation) for crop recommendation across 18 Nepal-specific crops; this result directly supersedes the 73.64% achieved by the initial SwiFT transformer, and the documented algorithm comparison constitutes an additional technical contribution of the project. A TTL model achieves 97.67% accuracy for crop-aware irrigation scheduling. A TabNet model achieves 99.44% accuracy for soil fertility classification. A second TabNet model achieves 97.43% accuracy for fertilizer recommendation from the five fertilizers available in Nepal. Both TabNet models provide LIME-based explanations. When a farmer confirms a recommended crop, the fertilizer and irrigation models automatically personalise their advice to that crop.

The frontend delivers real-time sensor display, multi-range historical trend analytics (48 hours to 6 months with adaptive bucketing), and a unified lucide icon system. The complete system is containerized with Docker and deployed on AWS EC2 with GitHub Actions CI/CD.

The total hardware cost per sensor node is under NPR 22,500. All software is open-source. The system runs on AWS free tier resources during the demonstration phase.

The known limitations include the partial reliance on Indian agricultural data for crop classification, the absence of direct NPK sensor measurement requiring manual input, WiFi dependency for data transmission, and the lack of validation against actual harvest outcomes. These limitations define clear and prioritised directions for future work, particularly local dataset collection, NPK sensor integration, and LoRa communication for remote areas.

As an MVP, this project delivers a working, deployed, and documented foundation that demonstrates the technical feasibility of affordable, sensor-based agricultural decision support for Nepal's farming communities. The modular architecture allows every component — hardware, models, and frontend — to be upgraded independently as the system evolves.

---
# APPENDICES

## Appendix A: Project Budget

**Table 12: Detailed Budget Breakdown**

| S.N. | Item | Qty | Unit Cost (NPR) | Total (NPR) |
|---|---|---|---|---|
| **A.** | **Equipment / Materials** | | | |
| 1 | ESP32-WROOM-32 Development Board | 1 | 1,500 | 1,500 |
| 2 | DHT22 Temperature and Humidity Sensor | 1 | 500 | 500 |
| 3 | Capacitive Soil Moisture Sensor v2.0 | 1 | 400 | 400 |
| 4 | PH-4502C pH Sensor Module with Probe | 1 | 8,000 | 8,000 |
| 5 | Solar Panel 6V 5W | 1 | 1,500 | 1,500 |
| 6 | TP4056 Li-ion Charger Module | 1 | 200 | 200 |
| 7 | 18650 Li-ion Battery 2600 mAh | 2 | 500 | 1,000 |
| 8 | Breadboard (830 point) | 1 | 300 | 300 |
| 9 | Jumper Wires (40 pack) | 2 | 150 | 300 |
| 10 | Waterproof Enclosure IP65 | 1 | 800 | 800 |
| 11 | Miscellaneous (resistors, connectors) | 1 | 500 | 500 |
| **B.** | **Implementation and Deployment** | | | |
| 12 | Cloud Services (AWS EC2, MongoDB Atlas) | 6 months | 300/mo | 1,800 |
| 13 | Domain and SSL Certificate | 1 | 0 | 0 |
| **C.** | **Other Costs** | | | |
| 14 | Internet and Communication | | — | 1,000 |
| 15 | Report Printing, Copying and Binding | | — | 2,000 |
| 16 | Transportation | | — | 1,500 |
| 17 | Miscellaneous | | — | 1,200 |
| | **Total** | | | **22,500** |

*Note: All software tools (Python, FastAPI, Next.js, scikit-learn, XGBoost, LightGBM, PyTorch, Docker, and others) are open-source and free of charge. Cloud resources were used within free tier limits during development.*

## Appendix B: Project Timeline (Gantt Chart)

**Table 13: Project Timeline – February to July 2026**

| Activity | Feb | Mar | Apr | May | Jun | Jul |
|---|---|---|---|---|---|---|
| Literature Review and Proposal | ████ | ████ | | | | |
| Hardware Procurement | | ████ | ████ | | | |
| Sensor Integration and Calibration | | | ████ | ████ | | |
| Backend Development (FastAPI + MongoDB) | | | ████ | ████ | | |
| ML Models — Initial Development | | | ████ | ████ | | |
| ML Models — Crop Iteration (SwiFT → Ensemble) | | | | ████ | ████ | |
| Frontend Development (Next.js) | | | | ████ | ████ | |
| Cloud Deployment (Docker + AWS) | | | | ████ | ████ | |
| Field Testing and Validation | | | | | ████ | ████ |
| Documentation and Report Writing | ████ | | | | ████ | ████ |

## Appendix C: ESP32 Wiring Guide

**Table 14: ESP32 Pin Connections**

| Component | ESP32 Pin | Connection Type | Notes |
|---|---|---|---|
| DHT22 Data | GPIO 4 | Digital | 10 kΩ pull-up resistor to 3.3V |
| DHT22 VCC | 3.3V | Power | |
| DHT22 GND | GND | Ground | |
| Soil Moisture Signal | GPIO 34 | Analog (ADC1_CH6) | Input-only pin; do not use as output |
| Soil Moisture VCC | 3.3V | Power | |
| Soil Moisture GND | GND | Ground | |
| PH-4502C Signal | GPIO 35 | Analog (ADC1_CH7) | Input-only pin; do not use as output |
| PH-4502C VCC | 5V | Power | Module has onboard 3.3V regulator |
| PH-4502C GND | GND | Ground | |

> **[FIGURE 11: ESP32 Sensor Wiring Diagram]**
> _Caption:_ Figure 11: ESP32 Sensor Wiring Diagram
> _Layout note:_ Wiring diagram showing ESP32 connections to all three sensors and the TP4056 solar charging circuit
> _Diagram source:_ Wokwi wiring spec in `figures/figure-11-esp32-wiring-diagram.md` (paste-ready diagram.json)

## Appendix D: ML Model Artifacts

**Table 15: Saved Model Artefact Files and Sizes**

| File | Size | Purpose |
|---|---|---|
| crop_ensemble.joblib | ~12 MB | Serialised VotingClassifier (RF + XGBoost + LightGBM) |
| crop_scaler.joblib | 0.9 KB | Feature StandardScaler for crop model |
| crop_label_encoder.joblib | 0.8 KB | 18-class crop label encoder |
| crop_feature_names.joblib | 0.2 KB | Ordered feature names list |
| ttl_irrigation_model.pth | ~421 KB | FT-Transformer weights (PyTorch) |
| ttl_config.joblib | 0.1 KB | Model architecture configuration |
| ttl_scaler.joblib | 0.8 KB | Feature StandardScaler for irrigation model |
| ttl_labels.joblib | 0.2 KB | 5-class urgency label list |
| tabnet_soil.zip | ~383 KB | TabNet soil fertility model archive |
| soil_scaler.joblib | 0.7 KB | Feature StandardScaler for soil model |
| soil_encoder.joblib | 0.5 KB | 3-class fertility label encoder |
| soil_lime_bg.joblib | 4.1 KB | 200-sample LIME background set |
| tabnet_fert.zip | ~386 KB | TabNet fertilizer recommendation model archive |
| fert_scaler.joblib | 0.8 KB | Feature StandardScaler for fertilizer model |
| fert_encoder.joblib | 0.6 KB | 5-class fertilizer label encoder |
| fert_lime_bg.joblib | 6.5 KB | 200-sample LIME background set |

## Appendix E: API Endpoint Documentation

The complete, interactive API documentation is auto-generated by FastAPI and is accessible at `/docs` (Swagger UI) and `/redoc` (ReDoc) when the server is running. Key endpoint summaries are provided below.

**Table 16: REST API Endpoints Summary**

| Endpoint | Method | Description |
|---|---|---|
| /api/recommend/crop | POST | Returns top-3 crops with confidence scores from the ensemble model |
| /api/recommend/fertilizer | POST | Returns fertilizer recommendation; supports crop_aware flag |
| /api/recommend/irrigation | POST | Returns irrigation urgency level; supports crop_aware flag |
| /api/recommend/soil | POST | Returns soil fertility class with optional LIME explanation |
| /api/recommend/complete | POST | Runs all four models and returns a complete advisory report |
| /api/recommend/explain | POST | Returns LIME feature attributions for TabNet models |
| /api/sensors/latest | GET | Returns the most recently received sensor reading |
| /api/sensors/history | GET | Returns the last N sensor readings (N configurable) |
| /api/analytics/trends | GET | Returns adaptive time-bucketed trend data for the selected range |
| /api/weather/current | GET | Returns current weather for Mahendranagar (OWM, cached 10 min) |
| /api/health | GET | Returns system health: MongoDB, MQTT, ML models, weather API status |

---
# REFERENCES

[1] E. Alreshidi, "Smart Sustainable Agriculture (SSA) Solution Underpinned by Internet of Things (IoT) and Artificial Intelligence (AI)," Int. J. Adv. Comput. Sci. Appl., vol. 10, no. 5, pp. 93–102, 2019.

[2] V. K. Quy, N. V. Hau, D. V. Anh, N. M. Quy, N. T. Ban, S. Lanza, G. Randazzo, and A. Muzirafuti, "IoT-Enabled Smart Agriculture: Architecture, Applications, and Challenges," Appl. Sci., vol. 12, no. 7, p. 3396, 2022, doi: 10.3390/app12073396.

[3] "Optimizing Agricultural Efficiency: A Fusion of IoT, AI, Cloud Computing, and Wireless Sensor Network," Preprint, SSRN Electron. J., 2024, doi: 10.2139/ssrn.4789232.

[4] A. S. Ibrahim et al., "AI-IoT based smart agriculture pivot for plant diseases detection and treatment," Sci. Rep., vol. 15, no. 1, p. 16576, Dec. 2025, doi: 10.1038/s41598-025-98454-6.

[5] I. Hossain et al., "IoT Based Smart Irrigation System on Renewable Energy," International Journal of Innovative Science and Research Technology, vol. 7, no. 6, pp. 53–59, 2022.

[6] J. Kim et al., "Real-Time Smart Farming Using IoT and AI Models," Agriculture, vol. 15, no. 5, p. 554, 2023, doi: 10.3390/agriculture15050554.

[7] K. P. Reddy and A. Ghosh, "Performance Analysis of IoT Based Smart Agriculture Systems," Wireless Personal Communications, vol. 120, pp. 2569–2591, 2021, doi: 10.1007/s11277-021-09462-4.

[8] X. Zhang et al., "Edge and Cloud Enabled Smart Farming Framework," IEEE Access, 2025, doi: 10.1109/ACCESS.2025.3594162.

[9] Y. Liu and P. Singh, "Drivers and Barriers to IoT Adoption in Agriculture," Heliyon, e25112, 2024, doi: 10.1016/j.heliyon.2024.e25112.

[10] S. Ahmed and R. Khan, "Machine Learning Approaches for Precision Agriculture," IEEE Access, 2021, doi: 10.1109/ACCESS.2021.3138160.

[11] L. Breiman, "Random Forests," Machine Learning, vol. 45, no. 1, pp. 5–32, 2001.

[12] T. Chen and C. Guestrin, "XGBoost: A Scalable Tree Boosting System," in Proc. 22nd ACM SIGKDD Int. Conf. Knowledge Discovery and Data Mining (KDD '16), New York, NY, USA: ACM, 2016, pp. 785–794.

[13] G. Ke et al., "LightGBM: A Highly Efficient Gradient Boosting Decision Tree," in Advances in Neural Information Processing Systems (NeurIPS), vol. 30, 2017.

[14] N. V. Chawla, K. W. Bowyer, L. O. Hall, and W. P. Kegelmeyer, "SMOTE: Synthetic Minority Over-sampling Technique," Journal of Artificial Intelligence Research, vol. 16, pp. 321–357, 2002.

[15] S. Ö. Arik and T. Pfister, "TabNet: Attentive Interpretable Tabular Learning," in Proc. AAAI Conf. Artificial Intelligence, vol. 35, no. 8, 2021, pp. 6679–6687.

[16] Y. Gorishniy, I. Rubachev, V. Khrulkov, and A. Babenko, "Revisiting Deep Learning Models for Tabular Data," in Advances in Neural Information Processing Systems (NeurIPS), vol. 34, 2021.

[17] M. T. Ribeiro, S. Singh, and C. Guestrin, "'Why Should I Trust You?': Explaining the Predictions of Any Classifier," in Proc. 22nd ACM SIGKDD Int. Conf. Knowledge Discovery and Data Mining (KDD '16), New York, NY, USA: ACM, 2016, pp. 1135–1144.

[18] L. Grinsztajn, E. Oyallon, and G. Varoquaux, "Why do tree-based models still outperform deep learning on typical tabular data?," in Advances in Neural Information Processing Systems (NeurIPS), vol. 35, 2022.

[19] R. G. Allen, L. S. Pereira, D. Raes, and M. Smith, "Crop Evapotranspiration — Guidelines for Computing Crop Water Requirements," FAO Irrigation and Drainage Paper 56, Food and Agriculture Organization of the United Nations, Rome, 1998.
