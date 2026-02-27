export interface PatientData {
  name: string;
  age: number;
  gender: 'M' | 'F';
  indication: string;
}

export type FindingStatus = "worsened" | "changed" | "same";

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface StructuredFinding {
  id: string;
  category: string;
  description: string;
  status: FindingStatus;
}


export interface Finding {
  id: string;
  text: string;
  isCritical: boolean;
  boundingBox?: BoundingBox;
  status?: FindingStatus;
  structuredFindings?: StructuredFinding[];
}