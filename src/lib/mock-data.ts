export type DecisionItem = {
  id: string;
  company: string;
  domain: string;
  country: string;
  dealSize: string;
  decisionType: string;
  recommendation: string;
  confidence: "Low" | "Medium" | "High";
  updatedAt: string;
  signals: {
    label: string;
    value: string;
  }[];
  suggestedConditions: string[];
};

export const decisionQueue: DecisionItem[] = [
  {
    id: "dec-10024",
    company: "Northwind GPU Logistics",
    domain: "northwindgpu.com",
    country: "United States",
    dealSize: "$120k",
    decisionType: "Discount",
    recommendation: "Approve with conditions",
    confidence: "Medium",
    updatedAt: "2 min ago",
    signals: [
      { label: "Reddit complaints", value: "5 recent" },
      { label: "Payment history", value: "Unknown" },
      { label: "G2 rating", value: "2.8" }
    ],
    suggestedConditions: ["Require upfront payment", "Limit discount to 10%"]
  },
  {
    id: "dec-10025",
    company: "Aurora Micro Devices",
    domain: "auroramicro.io",
    country: "Germany",
    dealSize: "$340k",
    decisionType: "Payment terms",
    recommendation: "Escalate",
    confidence: "High",
    updatedAt: "9 min ago",
    signals: [
      { label: "Court records", value: "1 open dispute" },
      { label: "Trustpilot", value: "4.2" },
      { label: "Twitter sentiment", value: "Neutral" }
    ],
    suggestedConditions: ["Legal review required", "Net-30 only"]
  },
  {
    id: "dec-10026",
    company: "Atlas Edge AI",
    domain: "atlasedge.ai",
    country: "Singapore",
    dealSize: "$78k",
    decisionType: "Onboarding",
    recommendation: "Approve",
    confidence: "High",
    updatedAt: "21 min ago",
    signals: [
      { label: "News mentions", value: "Positive" },
      { label: "Payment history", value: "Prepay" },
      { label: "LinkedIn", value: "Verified" }
    ],
    suggestedConditions: ["Standard terms"]
  }
];

export const precedentDecisions = [
  {
    id: "dec-9940",
    company: "Nimbus Compute",
    action: "Approved",
    outcome: "Paid on time",
    note: "Prepay required"
  },
  {
    id: "dec-9902",
    company: "PolarStack",
    action: "Overridden",
    outcome: "Expanded",
    note: "Strategic logo win"
  },
  {
    id: "dec-9877",
    company: "VectorForge",
    action: "Rejected",
    outcome: "Churned",
    note: "Fraud signal confirmed"
  }
];
