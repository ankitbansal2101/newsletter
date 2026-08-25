export type TopologyNode = {
  clusterId: number;
  rank: number;
  headline: string;
  category: string;
  score: number;
  freshRecords: number;
  freshSources: number;
  dominantType: string;
  hasNews: boolean;
  hasPrimary: boolean;
  x: number;
  y: number;
};

export type TopologyLink = {
  source: number;
  target: number;
  affinity: number;
  flow: number;
  direction: string;
  flowFrom: number | null;
  flowTo: number | null;
  lagDays: number | null;
  sameCategory: boolean;
  sharedSourceType: boolean;
  basis: string[];
};

export const topologyData: { nodes: TopologyNode[]; links: TopologyLink[] } = {
  "nodes": [
    {
      "clusterId": 9,
      "rank": 39,
      "headline": "Materials Mining / Energy / Legislation is showing deployment-adjacent signals across filing, paper",
      "category": "Materials / Mining",
      "score": 36.65,
      "freshRecords": 0,
      "freshSources": 0,
      "dominantType": "corpus",
      "hasNews": false,
      "hasPrimary": true,
      "x": -5.1325,
      "y": 9.0285
    },
    {
      "clusterId": 10,
      "rank": 24,
      "headline": "Robotics Ai / Semiconductors / Materials Mining is showing deployment-adjacent signals across filing, paper",
      "category": "Materials / Mining",
      "score": 39.65,
      "freshRecords": 3,
      "freshSources": 3,
      "dominantType": "ml_community",
      "hasNews": true,
      "hasPrimary": true,
      "x": -2.9354,
      "y": 1.2907
    },
    {
      "clusterId": 46,
      "rank": 25,
      "headline": "Robotics / Stiffness / Machine Learning activity is accelerating across 4 sources",
      "category": "Robotics",
      "score": 39.55,
      "freshRecords": 0,
      "freshSources": 0,
      "dominantType": "corpus",
      "hasNews": false,
      "hasPrimary": false,
      "x": 6.2875,
      "y": 2.5159
    },
    {
      "clusterId": 60,
      "rank": 2,
      "headline": "Ai Agent / Google / Llm may be a lead, but it needs independent corroboration",
      "category": "AI / LLM",
      "score": 56.58,
      "freshRecords": 54,
      "freshSources": 17,
      "dominantType": "news",
      "hasNews": true,
      "hasPrimary": true,
      "x": 1.8387,
      "y": 5.1038
    },
    {
      "clusterId": 65,
      "rank": 19,
      "headline": "Microsoft / Google / Ai Agent is showing deployment-adjacent signals across code, discourse, paper",
      "category": "AI / LLM",
      "score": 40.36,
      "freshRecords": 9,
      "freshSources": 5,
      "dominantType": "ml_community",
      "hasNews": true,
      "hasPrimary": false,
      "x": 1.3375,
      "y": 4.6133
    },
    {
      "clusterId": 66,
      "rank": 28,
      "headline": "Artificial Intelligence / cs.CE / Counterfactual Thinking is useful context for the ai / llm beat",
      "category": "AI / LLM",
      "score": 38.74,
      "freshRecords": 6,
      "freshSources": 5,
      "dominantType": "news",
      "hasNews": true,
      "hasPrimary": false,
      "x": 4.1912,
      "y": 7.7567
    },
    {
      "clusterId": 67,
      "rank": 23,
      "headline": "cs.CE / Economics / Natural Language Processing is useful context for the ml research beat",
      "category": "ML Research",
      "score": 39.99,
      "freshRecords": 6,
      "freshSources": 2,
      "dominantType": "arxiv",
      "hasNews": true,
      "hasPrimary": false,
      "x": 3.5596,
      "y": 8.0576
    },
    {
      "clusterId": 82,
      "rank": 4,
      "headline": "Workflow / Software Analytics / Workforce is useful context for the ai / llm beat",
      "category": "AI / LLM",
      "score": 49.09,
      "freshRecords": 12,
      "freshSources": 8,
      "dominantType": "news",
      "hasNews": true,
      "hasPrimary": false,
      "x": 3.545,
      "y": 6.9459
    },
    {
      "clusterId": 89,
      "rank": 12,
      "headline": "Software Deployment / Digital Economy / Scarcity is useful context for the climate / sustainability beat",
      "category": "Climate / Sustainability",
      "score": 45.33,
      "freshRecords": 7,
      "freshSources": 6,
      "dominantType": "news",
      "hasNews": true,
      "hasPrimary": false,
      "x": 3.6773,
      "y": 8.0118
    },
    {
      "clusterId": 90,
      "rank": 40,
      "headline": "Natural Language Processing / Metadata / Turkish is useful context for the ml research beat",
      "category": "ML Research",
      "score": 36.59,
      "freshRecords": 3,
      "freshSources": 2,
      "dominantType": "arxiv",
      "hasNews": false,
      "hasPrimary": false,
      "x": 4.8012,
      "y": 5.5786
    },
    {
      "clusterId": 93,
      "rank": 38,
      "headline": "Metadata / Dimension (Graph Theory) / Workflow is useful context for the ml research beat",
      "category": "ML Research",
      "score": 36.77,
      "freshRecords": 5,
      "freshSources": 5,
      "dominantType": "news",
      "hasNews": true,
      "hasPrimary": false,
      "x": 4.5164,
      "y": 6.2698
    },
    {
      "clusterId": 95,
      "rank": 32,
      "headline": "Control Systems / Renewable Energy / Photovoltaic System is useful context for the energy beat",
      "category": "Energy",
      "score": 38.2,
      "freshRecords": 2,
      "freshSources": 2,
      "dominantType": "sec",
      "hasNews": false,
      "hasPrimary": true,
      "x": 7.5098,
      "y": 8.8412
    },
    {
      "clusterId": 98,
      "rank": 14,
      "headline": "Natural Language Processing / cs.SD / eess.AS is useful context for the ml research beat",
      "category": "ML Research",
      "score": 43.09,
      "freshRecords": 4,
      "freshSources": 4,
      "dominantType": "news",
      "hasNews": true,
      "hasPrimary": false,
      "x": 5.696,
      "y": 4.7782
    },
    {
      "clusterId": 102,
      "rank": 11,
      "headline": "Corporate Governance / Knowledge Management / Transparency (Behavior) is useful context for the ai / llm beat",
      "category": "AI / LLM",
      "score": 45.54,
      "freshRecords": 10,
      "freshSources": 7,
      "dominantType": "news",
      "hasNews": true,
      "hasPrimary": false,
      "x": 4.2574,
      "y": 7.0809
    },
    {
      "clusterId": 106,
      "rank": 5,
      "headline": "Knowledge Management / Generative Grammar / Task (Project Management) is useful context for the ai / llm beat",
      "category": "AI / LLM",
      "score": 48.95,
      "freshRecords": 12,
      "freshSources": 7,
      "dominantType": "news",
      "hasNews": true,
      "hasPrimary": false,
      "x": 3.2838,
      "y": 7.4253
    },
    {
      "clusterId": 121,
      "rank": 22,
      "headline": "Signal Processing / cs.IT / Ranging activity is accelerating across 4 sources",
      "category": "Space",
      "score": 40.07,
      "freshRecords": 21,
      "freshSources": 2,
      "dominantType": "arxiv",
      "hasNews": false,
      "hasPrimary": false,
      "x": 7.8241,
      "y": 8.1482
    },
    {
      "clusterId": 124,
      "rank": 27,
      "headline": "Neural Computing / cs.AR / cs.ET is useful context for the ml research beat",
      "category": "ML Research",
      "score": 39.19,
      "freshRecords": 3,
      "freshSources": 3,
      "dominantType": "arxiv",
      "hasNews": true,
      "hasPrimary": false,
      "x": 8.1184,
      "y": 6.6647
    },
    {
      "clusterId": 125,
      "rank": 26,
      "headline": "Neural Computing / q bio.NC / Tuft is useful context for the robotics beat",
      "category": "Robotics",
      "score": 39.54,
      "freshRecords": 3,
      "freshSources": 3,
      "dominantType": "arxiv",
      "hasNews": true,
      "hasPrimary": false,
      "x": 8.0582,
      "y": 6.3871
    },
    {
      "clusterId": 145,
      "rank": 6,
      "headline": "Control Systems / Generative Grammar / Artificial Intelligence is useful context for the ai / llm beat",
      "category": "AI / LLM",
      "score": 47.23,
      "freshRecords": 8,
      "freshSources": 6,
      "dominantType": "arxiv",
      "hasNews": true,
      "hasPrimary": false,
      "x": 5.0152,
      "y": 6.5656
    },
    {
      "clusterId": 153,
      "rank": 8,
      "headline": "Computer Security / Machine Learning / Intrusion Detection System is useful context for the ml research beat",
      "category": "ML Research",
      "score": 46.31,
      "freshRecords": 11,
      "freshSources": 8,
      "dominantType": "news",
      "hasNews": true,
      "hasPrimary": false,
      "x": 6.058,
      "y": 5.2821
    },
    {
      "clusterId": 157,
      "rank": 13,
      "headline": "Machine Learning / Regularization (Linguistics) / Signal Processing is useful context for the ml research beat",
      "category": "ML Research",
      "score": 43.94,
      "freshRecords": 12,
      "freshSources": 5,
      "dominantType": "arxiv",
      "hasNews": false,
      "hasPrimary": false,
      "x": 7.7501,
      "y": 8.4046
    },
    {
      "clusterId": 160,
      "rank": 33,
      "headline": "Rubric / Json / Identification (Biology) is useful context for the ai / llm beat",
      "category": "AI / LLM",
      "score": 38.12,
      "freshRecords": 0,
      "freshSources": 0,
      "dominantType": "corpus",
      "hasNews": false,
      "hasPrimary": false,
      "x": 4.8345,
      "y": 5.7317
    },
    {
      "clusterId": 161,
      "rank": 30,
      "headline": "Vulnerability (Computing) / Inference / Python (Programming Language) is useful context for the ml research beat",
      "category": "ML Research",
      "score": 38.54,
      "freshRecords": 4,
      "freshSources": 3,
      "dominantType": "news",
      "hasNews": true,
      "hasPrimary": false,
      "x": 4.8287,
      "y": 5.3024
    },
    {
      "clusterId": 175,
      "rank": 9,
      "headline": "Robotics / Drone / Probabilistic Logic activity is accelerating across 4 sources",
      "category": "Robotics",
      "score": 46.22,
      "freshRecords": 7,
      "freshSources": 4,
      "dominantType": "arxiv",
      "hasNews": true,
      "hasPrimary": true,
      "x": 6.9075,
      "y": 7.6536
    },
    {
      "clusterId": 176,
      "rank": 37,
      "headline": "Robotics / Vehicle Routing Problem / Artificial Intelligence is useful context for the ai / llm beat",
      "category": "AI / LLM",
      "score": 37.13,
      "freshRecords": 0,
      "freshSources": 0,
      "dominantType": "corpus",
      "hasNews": false,
      "hasPrimary": false,
      "x": 6.6436,
      "y": 7.7322
    },
    {
      "clusterId": 181,
      "rank": 31,
      "headline": "Robotics / Control Systems / Control Theory (Sociology) activity is accelerating across 4 sources",
      "category": "Robotics",
      "score": 38.52,
      "freshRecords": 4,
      "freshSources": 3,
      "dominantType": "arxiv",
      "hasNews": false,
      "hasPrimary": false,
      "x": 7.1708,
      "y": 7.7783
    },
    {
      "clusterId": 185,
      "rank": 18,
      "headline": "Natural Language Processing / Automatic Summarization / Literal And Figurative Language is useful context for the ml research beat",
      "category": "ML Research",
      "score": 41.64,
      "freshRecords": 5,
      "freshSources": 2,
      "dominantType": "arxiv",
      "hasNews": true,
      "hasPrimary": false,
      "x": 4.9355,
      "y": 5.0566
    },
    {
      "clusterId": 188,
      "rank": 20,
      "headline": "Natural Language Processing / Machine Learning / Interpretability activity is accelerating across 3 sources",
      "category": "AI / LLM",
      "score": 40.28,
      "freshRecords": 0,
      "freshSources": 0,
      "dominantType": "corpus",
      "hasNews": false,
      "hasPrimary": false,
      "x": 6.0666,
      "y": 5.9256
    },
    {
      "clusterId": 189,
      "rank": 35,
      "headline": "Natural Language Processing / Artificial Intelligence / Machine Learning activity is accelerating across 4 sources",
      "category": "AI / LLM",
      "score": 37.56,
      "freshRecords": 0,
      "freshSources": 0,
      "dominantType": "corpus",
      "hasNews": false,
      "hasPrimary": false,
      "x": 5.5809,
      "y": 6.404
    },
    {
      "clusterId": 190,
      "rank": 16,
      "headline": "Natural Language Processing / Machine Learning / Artificial Intelligence is useful context for the ai / llm beat",
      "category": "AI / LLM",
      "score": 42.14,
      "freshRecords": 7,
      "freshSources": 3,
      "dominantType": "arxiv",
      "hasNews": false,
      "hasPrimary": false,
      "x": 5.5974,
      "y": 6.061
    },
    {
      "clusterId": 191,
      "rank": 1,
      "headline": "Robotics / Computer Vision / Machine Learning activity is accelerating across 6 sources",
      "category": "Robotics",
      "score": 57.66,
      "freshRecords": 37,
      "freshSources": 6,
      "dominantType": "arxiv",
      "hasNews": true,
      "hasPrimary": true,
      "x": 6.8792,
      "y": 6.8853
    },
    {
      "clusterId": 192,
      "rank": 15,
      "headline": "Computer Vision / Interpretability / Segmentation is useful context for the ml research beat",
      "category": "ML Research",
      "score": 42.38,
      "freshRecords": 12,
      "freshSources": 3,
      "dominantType": "arxiv",
      "hasNews": false,
      "hasPrimary": false,
      "x": 6.7245,
      "y": 6.0057
    },
    {
      "clusterId": 201,
      "rank": 29,
      "headline": "Quantum Physics / Hypergraph / Reachability is useful context for the energy beat",
      "category": "Energy",
      "score": 38.68,
      "freshRecords": 4,
      "freshSources": 4,
      "dominantType": "arxiv",
      "hasNews": false,
      "hasPrimary": false,
      "x": 7.192,
      "y": 9.1101
    },
    {
      "clusterId": 202,
      "rank": 10,
      "headline": "cs.CE / Machine Learning / Artificial Neural Network is useful context for the ml research beat",
      "category": "ML Research",
      "score": 45.7,
      "freshRecords": 13,
      "freshSources": 3,
      "dominantType": "arxiv",
      "hasNews": true,
      "hasPrimary": false,
      "x": 9.3358,
      "y": 8.5381
    },
    {
      "clusterId": 220,
      "rank": 21,
      "headline": "Health Care / Workflow / Corporate Governance is useful context for the bio / health beat",
      "category": "Bio / Health",
      "score": 40.21,
      "freshRecords": 5,
      "freshSources": 4,
      "dominantType": "news",
      "hasNews": true,
      "hasPrimary": false,
      "x": 7.9534,
      "y": 4.1068
    },
    {
      "clusterId": 221,
      "rank": 17,
      "headline": "Quantum Physics / Quantum Materials / Hep Th activity is accelerating across 4 sources",
      "category": "Quantum",
      "score": 41.67,
      "freshRecords": 8,
      "freshSources": 3,
      "dominantType": "arxiv",
      "hasNews": true,
      "hasPrimary": false,
      "x": 9.1866,
      "y": 10.2045
    },
    {
      "clusterId": 224,
      "rank": 7,
      "headline": "Quantum Physics / Advanced Materials / Optics activity is accelerating across 4 sources",
      "category": "Quantum",
      "score": 46.48,
      "freshRecords": 8,
      "freshSources": 4,
      "dominantType": "arxiv",
      "hasNews": true,
      "hasPrimary": false,
      "x": 10.049,
      "y": 10.1302
    },
    {
      "clusterId": 227,
      "rank": 34,
      "headline": "Artificial Intelligence / Computer Vision / Deep Learning is useful context for the bio / health beat",
      "category": "Bio / Health",
      "score": 37.81,
      "freshRecords": 0,
      "freshSources": 0,
      "dominantType": "corpus",
      "hasNews": false,
      "hasPrimary": false,
      "x": 8.3692,
      "y": 5.2103
    },
    {
      "clusterId": 238,
      "rank": 3,
      "headline": "Quantum Physics / Quantum / Machine Learning activity is accelerating across 4 sources",
      "category": "Quantum",
      "score": 51.54,
      "freshRecords": 27,
      "freshSources": 7,
      "dominantType": "arxiv",
      "hasNews": true,
      "hasPrimary": false,
      "x": 8.4747,
      "y": 9.851
    },
    {
      "clusterId": 249,
      "rank": 36,
      "headline": "q bio.BM / Machine Learning / Artificial Intelligence is useful context for the bio / health beat",
      "category": "Bio / Health",
      "score": 37.15,
      "freshRecords": 0,
      "freshSources": 0,
      "dominantType": "corpus",
      "hasNews": true,
      "hasPrimary": false,
      "x": 10.05,
      "y": 6.1454
    }
  ],
  "links": [
    {
      "source": 9,
      "target": 65,
      "affinity": 16,
      "flow": 8.41,
      "direction": "directed",
      "flowFrom": 9,
      "flowTo": 65,
      "lagDays": 215.52,
      "sameCategory": false,
      "sharedSourceType": false,
      "basis": [
        "older-to-newer timing: cluster 9 -> 65",
        "215.5 day lag"
      ]
    },
    {
      "source": 9,
      "target": 60,
      "affinity": 16,
      "flow": 8.41,
      "direction": "directed",
      "flowFrom": 9,
      "flowTo": 60,
      "lagDays": 215.56,
      "sameCategory": false,
      "sharedSourceType": false,
      "basis": [
        "older-to-newer timing: cluster 9 -> 60",
        "215.6 day lag"
      ]
    },
    {
      "source": 10,
      "target": 65,
      "affinity": 31.59,
      "flow": 19.58,
      "direction": "directed",
      "flowFrom": 10,
      "flowTo": 65,
      "lagDays": 488.52,
      "sameCategory": false,
      "sharedSourceType": true,
      "basis": [
        "older-to-newer timing: cluster 10 -> 65",
        "488.5 day lag"
      ]
    },
    {
      "source": 10,
      "target": 60,
      "affinity": 30.06,
      "flow": 18.82,
      "direction": "directed",
      "flowFrom": 10,
      "flowTo": 60,
      "lagDays": 488.56,
      "sameCategory": false,
      "sharedSourceType": true,
      "basis": [
        "older-to-newer timing: cluster 10 -> 60",
        "488.6 day lag"
      ]
    },
    {
      "source": 46,
      "target": 220,
      "affinity": 30.27,
      "flow": 50.74,
      "direction": "co_emergent",
      "flowFrom": null,
      "flowTo": null,
      "lagDays": 0,
      "sameCategory": false,
      "sharedSourceType": false,
      "basis": [
        "co-emergent timing",
        "0.0 day lag"
      ]
    },
    {
      "source": 46,
      "target": 98,
      "affinity": 29.95,
      "flow": 56.18,
      "direction": "co_emergent",
      "flowFrom": null,
      "flowTo": null,
      "lagDays": 0,
      "sameCategory": false,
      "sharedSourceType": false,
      "basis": [
        "co-emergent timing",
        "0.0 day lag"
      ]
    },
    {
      "source": 60,
      "target": 65,
      "affinity": 92.78,
      "flow": 88.34,
      "direction": "directed",
      "flowFrom": 65,
      "flowTo": 60,
      "lagDays": 0.05,
      "sameCategory": true,
      "sharedSourceType": true,
      "basis": [
        "older-to-newer timing: cluster 65 -> 60",
        "0.0 day lag"
      ]
    },
    {
      "source": 60,
      "target": 82,
      "affinity": 62.48,
      "flow": 60.09,
      "direction": "directed",
      "flowFrom": 82,
      "flowTo": 60,
      "lagDays": 0.56,
      "sameCategory": true,
      "sharedSourceType": true,
      "basis": [
        "older-to-newer timing: cluster 82 -> 60",
        "0.6 day lag"
      ]
    },
    {
      "source": 65,
      "target": 82,
      "affinity": 57.74,
      "flow": 58.05,
      "direction": "directed",
      "flowFrom": 82,
      "flowTo": 65,
      "lagDays": 0.52,
      "sameCategory": true,
      "sharedSourceType": true,
      "basis": [
        "older-to-newer timing: cluster 82 -> 65",
        "0.5 day lag"
      ]
    },
    {
      "source": 66,
      "target": 89,
      "affinity": 79.54,
      "flow": 73.77,
      "direction": "co_emergent",
      "flowFrom": null,
      "flowTo": null,
      "lagDays": 0,
      "sameCategory": false,
      "sharedSourceType": true,
      "basis": [
        "co-emergent timing",
        "0.0 day lag"
      ]
    },
    {
      "source": 66,
      "target": 102,
      "affinity": 93.56,
      "flow": 86.38,
      "direction": "co_emergent",
      "flowFrom": null,
      "flowTo": null,
      "lagDays": 0,
      "sameCategory": true,
      "sharedSourceType": true,
      "basis": [
        "co-emergent timing",
        "0.0 day lag"
      ]
    },
    {
      "source": 67,
      "target": 89,
      "affinity": 100,
      "flow": 85.6,
      "direction": "co_emergent",
      "flowFrom": null,
      "flowTo": null,
      "lagDays": 0,
      "sameCategory": false,
      "sharedSourceType": true,
      "basis": [
        "co-emergent timing",
        "0.0 day lag"
      ]
    },
    {
      "source": 67,
      "target": 106,
      "affinity": 75.18,
      "flow": 75.19,
      "direction": "co_emergent",
      "flowFrom": null,
      "flowTo": null,
      "lagDays": 0,
      "sameCategory": false,
      "sharedSourceType": true,
      "basis": [
        "co-emergent timing",
        "0.0 day lag"
      ]
    },
    {
      "source": 82,
      "target": 106,
      "affinity": 98.69,
      "flow": 84.94,
      "direction": "co_emergent",
      "flowFrom": null,
      "flowTo": null,
      "lagDays": 0,
      "sameCategory": true,
      "sharedSourceType": true,
      "basis": [
        "co-emergent timing",
        "0.0 day lag"
      ]
    },
    {
      "source": 82,
      "target": 102,
      "affinity": 91.97,
      "flow": 83.58,
      "direction": "co_emergent",
      "flowFrom": null,
      "flowTo": null,
      "lagDays": 0,
      "sameCategory": true,
      "sharedSourceType": true,
      "basis": [
        "co-emergent timing",
        "0.0 day lag"
      ]
    },
    {
      "source": 90,
      "target": 160,
      "affinity": 86.45,
      "flow": 82.83,
      "direction": "co_emergent",
      "flowFrom": null,
      "flowTo": null,
      "lagDays": 0,
      "sameCategory": false,
      "sharedSourceType": false,
      "basis": [
        "co-emergent timing",
        "0.0 day lag"
      ]
    },
    {
      "source": 90,
      "target": 161,
      "affinity": 96.27,
      "flow": 90.14,
      "direction": "co_emergent",
      "flowFrom": null,
      "flowTo": null,
      "lagDays": 0,
      "sameCategory": true,
      "sharedSourceType": false,
      "basis": [
        "co-emergent timing",
        "0.0 day lag"
      ]
    },
    {
      "source": 93,
      "target": 145,
      "affinity": 79.29,
      "flow": 76.85,
      "direction": "co_emergent",
      "flowFrom": null,
      "flowTo": null,
      "lagDays": 0,
      "sameCategory": false,
      "sharedSourceType": true,
      "basis": [
        "co-emergent timing",
        "0.0 day lag"
      ]
    },
    {
      "source": 93,
      "target": 160,
      "affinity": 61.54,
      "flow": 67.97,
      "direction": "co_emergent",
      "flowFrom": null,
      "flowTo": null,
      "lagDays": 0,
      "sameCategory": false,
      "sharedSourceType": false,
      "basis": [
        "co-emergent timing",
        "0.0 day lag"
      ]
    },
    {
      "source": 95,
      "target": 201,
      "affinity": 100,
      "flow": 86,
      "direction": "co_emergent",
      "flowFrom": null,
      "flowTo": null,
      "lagDays": 0,
      "sameCategory": true,
      "sharedSourceType": true,
      "basis": [
        "co-emergent timing",
        "0.0 day lag"
      ]
    },
    {
      "source": 95,
      "target": 157,
      "affinity": 82.74,
      "flow": 80.97,
      "direction": "co_emergent",
      "flowFrom": null,
      "flowTo": null,
      "lagDays": 0,
      "sameCategory": false,
      "sharedSourceType": true,
      "basis": [
        "co-emergent timing",
        "0.0 day lag"
      ]
    },
    {
      "source": 98,
      "target": 153,
      "affinity": 95.71,
      "flow": 89.06,
      "direction": "co_emergent",
      "flowFrom": null,
      "flowTo": null,
      "lagDays": 0,
      "sameCategory": true,
      "sharedSourceType": true,
      "basis": [
        "co-emergent timing",
        "0.0 day lag"
      ]
    },
    {
      "source": 98,
      "target": 185,
      "affinity": 89.25,
      "flow": 87.03,
      "direction": "co_emergent",
      "flowFrom": null,
      "flowTo": null,
      "lagDays": 0,
      "sameCategory": true,
      "sharedSourceType": true,
      "basis": [
        "co-emergent timing",
        "0.0 day lag"
      ]
    },
    {
      "source": 121,
      "target": 157,
      "affinity": 94.94,
      "flow": 90.27,
      "direction": "co_emergent",
      "flowFrom": null,
      "flowTo": null,
      "lagDays": 0,
      "sameCategory": false,
      "sharedSourceType": true,
      "basis": [
        "co-emergent timing",
        "0.0 day lag"
      ]
    },
    {
      "source": 121,
      "target": 181,
      "affinity": 73.12,
      "flow": 77.76,
      "direction": "co_emergent",
      "flowFrom": null,
      "flowTo": null,
      "lagDays": 0,
      "sameCategory": false,
      "sharedSourceType": true,
      "basis": [
        "co-emergent timing",
        "0.0 day lag"
      ]
    },
    {
      "source": 124,
      "target": 125,
      "affinity": 93.88,
      "flow": 91.34,
      "direction": "co_emergent",
      "flowFrom": null,
      "flowTo": null,
      "lagDays": 0,
      "sameCategory": false,
      "sharedSourceType": true,
      "basis": [
        "co-emergent timing",
        "0.0 day lag"
      ]
    },
    {
      "source": 124,
      "target": 191,
      "affinity": 60.27,
      "flow": 74.54,
      "direction": "co_emergent",
      "flowFrom": null,
      "flowTo": null,
      "lagDays": 0,
      "sameCategory": false,
      "sharedSourceType": true,
      "basis": [
        "co-emergent timing",
        "0.0 day lag"
      ]
    },
    {
      "source": 125,
      "target": 227,
      "affinity": 45.1,
      "flow": 63.75,
      "direction": "co_emergent",
      "flowFrom": null,
      "flowTo": null,
      "lagDays": 0,
      "sameCategory": false,
      "sharedSourceType": false,
      "basis": [
        "co-emergent timing",
        "0.0 day lag"
      ]
    },
    {
      "source": 145,
      "target": 189,
      "affinity": 80.96,
      "flow": 83.28,
      "direction": "co_emergent",
      "flowFrom": null,
      "flowTo": null,
      "lagDays": 0,
      "sameCategory": true,
      "sharedSourceType": false,
      "basis": [
        "co-emergent timing",
        "0.0 day lag"
      ]
    },
    {
      "source": 153,
      "target": 188,
      "affinity": 60.84,
      "flow": 68.02,
      "direction": "co_emergent",
      "flowFrom": null,
      "flowTo": null,
      "lagDays": 0,
      "sameCategory": false,
      "sharedSourceType": false,
      "basis": [
        "co-emergent timing",
        "0.0 day lag"
      ]
    },
    {
      "source": 160,
      "target": 161,
      "affinity": 69.96,
      "flow": 76.18,
      "direction": "co_emergent",
      "flowFrom": null,
      "flowTo": null,
      "lagDays": 0,
      "sameCategory": false,
      "sharedSourceType": false,
      "basis": [
        "co-emergent timing",
        "0.0 day lag"
      ]
    },
    {
      "source": 161,
      "target": 185,
      "affinity": 100,
      "flow": 87.6,
      "direction": "co_emergent",
      "flowFrom": null,
      "flowTo": null,
      "lagDays": 0,
      "sameCategory": true,
      "sharedSourceType": true,
      "basis": [
        "co-emergent timing",
        "0.0 day lag"
      ]
    },
    {
      "source": 175,
      "target": 176,
      "affinity": 78.41,
      "flow": 83.6,
      "direction": "co_emergent",
      "flowFrom": null,
      "flowTo": null,
      "lagDays": 0,
      "sameCategory": false,
      "sharedSourceType": false,
      "basis": [
        "co-emergent timing",
        "0.0 day lag"
      ]
    },
    {
      "source": 175,
      "target": 181,
      "affinity": 100,
      "flow": 91.2,
      "direction": "co_emergent",
      "flowFrom": null,
      "flowTo": null,
      "lagDays": 0,
      "sameCategory": true,
      "sharedSourceType": true,
      "basis": [
        "co-emergent timing",
        "0.0 day lag"
      ]
    },
    {
      "source": 176,
      "target": 181,
      "affinity": 65.39,
      "flow": 73.9,
      "direction": "co_emergent",
      "flowFrom": null,
      "flowTo": null,
      "lagDays": 0,
      "sameCategory": false,
      "sharedSourceType": false,
      "basis": [
        "co-emergent timing",
        "0.0 day lag"
      ]
    },
    {
      "source": 90,
      "target": 185,
      "affinity": 98.98,
      "flow": 88.69,
      "direction": "co_emergent",
      "flowFrom": null,
      "flowTo": null,
      "lagDays": 0,
      "sameCategory": true,
      "sharedSourceType": true,
      "basis": [
        "co-emergent timing",
        "0.0 day lag"
      ]
    },
    {
      "source": 188,
      "target": 190,
      "affinity": 85.19,
      "flow": 84.99,
      "direction": "co_emergent",
      "flowFrom": null,
      "flowTo": null,
      "lagDays": 0,
      "sameCategory": true,
      "sharedSourceType": false,
      "basis": [
        "co-emergent timing",
        "0.0 day lag"
      ]
    },
    {
      "source": 189,
      "target": 190,
      "affinity": 92.44,
      "flow": 90.62,
      "direction": "co_emergent",
      "flowFrom": null,
      "flowTo": null,
      "lagDays": 0,
      "sameCategory": true,
      "sharedSourceType": false,
      "basis": [
        "co-emergent timing",
        "0.0 day lag"
      ]
    },
    {
      "source": 175,
      "target": 191,
      "affinity": 90.53,
      "flow": 89.67,
      "direction": "co_emergent",
      "flowFrom": null,
      "flowTo": null,
      "lagDays": 0,
      "sameCategory": true,
      "sharedSourceType": true,
      "basis": [
        "co-emergent timing",
        "0.0 day lag"
      ]
    },
    {
      "source": 176,
      "target": 191,
      "affinity": 53.22,
      "flow": 71.01,
      "direction": "co_emergent",
      "flowFrom": null,
      "flowTo": null,
      "lagDays": 0,
      "sameCategory": false,
      "sharedSourceType": false,
      "basis": [
        "co-emergent timing",
        "0.0 day lag"
      ]
    },
    {
      "source": 188,
      "target": 192,
      "affinity": 60.14,
      "flow": 72.47,
      "direction": "co_emergent",
      "flowFrom": null,
      "flowTo": null,
      "lagDays": 0,
      "sameCategory": false,
      "sharedSourceType": false,
      "basis": [
        "co-emergent timing",
        "0.0 day lag"
      ]
    },
    {
      "source": 191,
      "target": 192,
      "affinity": 68.82,
      "flow": 78.81,
      "direction": "co_emergent",
      "flowFrom": null,
      "flowTo": null,
      "lagDays": 0,
      "sameCategory": false,
      "sharedSourceType": true,
      "basis": [
        "co-emergent timing",
        "0.0 day lag"
      ]
    },
    {
      "source": 157,
      "target": 201,
      "affinity": 68.64,
      "flow": 75.12,
      "direction": "co_emergent",
      "flowFrom": null,
      "flowTo": null,
      "lagDays": 0,
      "sameCategory": false,
      "sharedSourceType": true,
      "basis": [
        "co-emergent timing",
        "0.0 day lag"
      ]
    },
    {
      "source": 121,
      "target": 202,
      "affinity": 55.04,
      "flow": 68.72,
      "direction": "co_emergent",
      "flowFrom": null,
      "flowTo": null,
      "lagDays": 0,
      "sameCategory": false,
      "sharedSourceType": true,
      "basis": [
        "co-emergent timing",
        "0.0 day lag"
      ]
    },
    {
      "source": 202,
      "target": 238,
      "affinity": 54.91,
      "flow": 70.25,
      "direction": "co_emergent",
      "flowFrom": null,
      "flowTo": null,
      "lagDays": 0,
      "sameCategory": false,
      "sharedSourceType": true,
      "basis": [
        "co-emergent timing",
        "0.0 day lag"
      ]
    },
    {
      "source": 220,
      "target": 227,
      "affinity": 63.89,
      "flow": 70.74,
      "direction": "co_emergent",
      "flowFrom": null,
      "flowTo": null,
      "lagDays": 0,
      "sameCategory": true,
      "sharedSourceType": false,
      "basis": [
        "co-emergent timing",
        "0.0 day lag"
      ]
    },
    {
      "source": 153,
      "target": 220,
      "affinity": 46.96,
      "flow": 59.08,
      "direction": "co_emergent",
      "flowFrom": null,
      "flowTo": null,
      "lagDays": 0,
      "sameCategory": false,
      "sharedSourceType": true,
      "basis": [
        "co-emergent timing",
        "0.0 day lag"
      ]
    },
    {
      "source": 221,
      "target": 238,
      "affinity": 89.72,
      "flow": 86.06,
      "direction": "co_emergent",
      "flowFrom": null,
      "flowTo": null,
      "lagDays": 0,
      "sameCategory": true,
      "sharedSourceType": true,
      "basis": [
        "co-emergent timing",
        "0.0 day lag"
      ]
    },
    {
      "source": 221,
      "target": 224,
      "affinity": 87.6,
      "flow": 88.2,
      "direction": "co_emergent",
      "flowFrom": null,
      "flowTo": null,
      "lagDays": 0,
      "sameCategory": true,
      "sharedSourceType": true,
      "basis": [
        "co-emergent timing",
        "0.0 day lag"
      ]
    },
    {
      "source": 224,
      "target": 238,
      "affinity": 72.48,
      "flow": 80.64,
      "direction": "co_emergent",
      "flowFrom": null,
      "flowTo": null,
      "lagDays": 0,
      "sameCategory": true,
      "sharedSourceType": true,
      "basis": [
        "co-emergent timing",
        "0.0 day lag"
      ]
    },
    {
      "source": 95,
      "target": 238,
      "affinity": 57.72,
      "flow": 70.06,
      "direction": "co_emergent",
      "flowFrom": null,
      "flowTo": null,
      "lagDays": 0,
      "sameCategory": false,
      "sharedSourceType": true,
      "basis": [
        "co-emergent timing",
        "0.0 day lag"
      ]
    },
    {
      "source": 227,
      "target": 249,
      "affinity": 52.21,
      "flow": 70.5,
      "direction": "co_emergent",
      "flowFrom": null,
      "flowTo": null,
      "lagDays": 0,
      "sameCategory": true,
      "sharedSourceType": false,
      "basis": [
        "co-emergent timing",
        "0.0 day lag"
      ]
    },
    {
      "source": 124,
      "target": 249,
      "affinity": 33.33,
      "flow": 59.47,
      "direction": "co_emergent",
      "flowFrom": null,
      "flowTo": null,
      "lagDays": 0,
      "sameCategory": false,
      "sharedSourceType": false,
      "basis": [
        "co-emergent timing",
        "0.0 day lag"
      ]
    }
  ]
};

