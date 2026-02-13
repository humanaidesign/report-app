import React from "react";
import { Box, Typography } from "@mui/material";
import type { PatientData } from "../types";

interface PatientContextBarProps {
  patient: PatientData;
}

const PatientContextBar: React.FC<PatientContextBarProps> = ({
  patient,
}) => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      p: "12px 24px",
      bgcolor: "#121212",
    }}
  >
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
      <Typography
        variant="subtitle2"
        sx={{color: "white"}}
      >
        <strong>Patient Name: </strong>{patient.name} {patient.age} {patient.gender}
      </Typography>
      <Typography variant="subtitle2" sx={{ color: "#aaa" }}>
        <strong>Indication:</strong> {patient.indication}
      </Typography>
    </Box>
  </Box>
);

export default PatientContextBar;
