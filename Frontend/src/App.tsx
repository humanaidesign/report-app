import { Box, CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import Header from "./componets/Header";
import XRayViewer from "./componets/XRayView";
import PatientContextBar from "./componets/PatientInfo";
import AiInsights from "./componets/AiInsight";
import NarrativeReport from "./componets/NarrativeReport";
import { useState } from "react";
import type { Finding } from "./types";

const darkTheme = createTheme({ palette: { mode: "dark" } });

function App() {
  const patient = {
    name: "Jane Smith",
    age: 59,
    gender: "F" as const,
    indication: "59 year old woman with pleural effusion",
  };

  const [findings, setFindings] = useState<Finding[]>([]);
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(
    null,
  );
  const [hiddenFindingIds, setHiddenFindingIds] = useState<Set<string>>(
    new Set(),
  );
  const [imageUrl, setImageUrl] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [generatedReport, setGeneratedReport] = useState<string>("");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const handleImageUpload = async (file: File) => {
    const imagePreviewUrl = URL.createObjectURL(file);
    setImageUrl(imagePreviewUrl);
    setIsAnalyzing(true);
    setHiddenFindingIds(new Set());

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/api/analyze-xray", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.error) {
        console.error("Analysis error:", data.error);
        alert("Failed to analyze X-ray. Please try again.");
        setFindings([]);
      } else {
        setFindings(data);
        if (data.length > 0) {
          setSelectedFindingId(data[0].id);
        }
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload image. Make sure the backend is running.");
      setFindings([]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFindingSelect = (id: string) => {
    setSelectedFindingId((prevId) => (prevId === id ? null : id));
  };

  const handleToggleVisibility = (id: string) => {
    setHiddenFindingIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleRemoveFinding = (id: string) => {
    setFindings((prevFindings) => prevFindings.filter((f) => f.id !== id));

    if (selectedFindingId === id) {
      setSelectedFindingId(null);
    }
  };

  const handleGenerateReport = async () => {
    if (findings.length === 0) {
      alert("No findings to generate report from");
      return;
    }

    setIsGeneratingReport(true);

    try {
      const response = await fetch(
        "http://localhost:8000/api/generate-report",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(findings),
        },
      );

      const data = await response.json();

      if (data.report) {
        setGeneratedReport(data.report);
      } else {
        alert("Failed to generate report");
      }
    } catch (error) {
      console.error("Report generation failed:", error);
      alert("Failed to generate report. Make sure the backend is running.");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          bgcolor: "#121212",
        }}
      >
        <Header doctorName="John Doe, MD" />

        <Box
          sx={{ display: "flex", flex: 1, overflow: "hidden", p: 1, gap: 1 }}
        >
          <Box
            sx={{
              flex: "1 1 60%",
              display: "flex",
              flexDirection: "column",
              gap: 1,
              minWidth: 0,
            }}
          >
            <PatientContextBar patient={patient} />
            <Box sx={{ flex: 1, minHeight: 0 }}>
              <XRayViewer
                imageUrl={imageUrl}
                findings={findings}
                selectedFindingId={selectedFindingId}
                hiddenFindingIds={hiddenFindingIds}
                onFindingClick={handleFindingSelect}
                onImageUpload={handleImageUpload}
                isAnalyzing={isAnalyzing}
              />
            </Box>
          </Box>

          <Box
            sx={{
              mt: 6,
              flex: "0 0 300px",
              maxHeight: "100%",
              borderRadius: 1,
              overflow: "hidden",
            }}
          >
            <AiInsights
              findings={findings}
              selectedFindingId={selectedFindingId}
              hiddenFindingIds={hiddenFindingIds}
              onFindingSelect={handleFindingSelect}
              onRemoveFinding={handleRemoveFinding}
              onToggleVisibility={handleToggleVisibility}
              onGenerateReport={handleGenerateReport}
              isGeneratingReport={isGeneratingReport}
            />
          </Box>

          <Box sx={{ flex: "1 1 30%" }}>
            <NarrativeReport
              reportText={generatedReport}
              onReportChange={setGeneratedReport}
            />
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
