export interface PatientData {
  name: string;
  age: number;
  gender: 'M' | 'F';
  indication: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Finding {
  id: string;
  text: string;
  isCritical: boolean;
  boundingBox?: BoundingBox;
}