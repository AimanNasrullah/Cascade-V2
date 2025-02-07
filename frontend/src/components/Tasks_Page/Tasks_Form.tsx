import {
  Typography,
  Box,
  Divider,
  TextField,
  Button,
  Stack,
  IconButton,
  styled,
  Checkbox,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import api from "../../api";
import { useState, ChangeEvent, FormEvent } from "react";
import { Dayjs } from "dayjs";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import FileUploadIcon from "@mui/icons-material/FileUpload";

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

const InsertTasks = ({ classId }: { classId: string }) => {
  const [name, setTaskName] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [description, setTaskDescription] = useState<string>("");
  const [start_date, setStartDate] = useState<Dayjs | null>(null);
  const [due_date, setDueDate] = useState<Dayjs | null>(null);
  const [submission_required, setSubmissionRequired] = useState<boolean>(false);
  const [subtasks, setSubtasks] = useState<
    { title: string; description: string }[]
  >([{ title: "", description: "" }]);

  const createTask = async (e: FormEvent) => {
    e.preventDefault();

    try {
      const subtaskPromises = subtasks.map((subtask) =>
        api.post("/api/subtasks/", subtask)
      );
      const subtaskResponses = await Promise.all(subtaskPromises);
      const subtaskIds = subtaskResponses.map((res) => res.data.id);

      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      if (start_date)
        formData.append("start_date", start_date.format("YYYY-MM-DD"));
      if (due_date) formData.append("due_date", due_date.format("YYYY-MM-DD"));
      formData.append("require_file", JSON.stringify(submission_required));
      formData.append("class_id", classId);
      if (file) formData.append("file_upload", file);

      subtaskIds.forEach((id) => formData.append("subtasks", id.toString()));

      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
      }

      const { data } = await api.post("/api/tasks/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Response data:", data);
      alert("Task created successfully!");
      window.location.reload();
    } catch (err) {
      console.log(err);
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (file) {
      if (file.type !== "application/pdf") {
        alert("Please upload a PDF file.");
        event.target.value = "";
        return;
      }
      setFile(file);
    }
  };

  const handleSubtaskChange = (index: number, field: string, value: string) => {
    const newSubtasks = subtasks.map((subtask, i) =>
      i === index ? { ...subtask, [field]: value } : subtask
    );
    setSubtasks(newSubtasks);
  };

  const addSubtask = () => {
    setSubtasks([...subtasks, { title: "", description: "" }]);
  };

  const removeSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  return (
    <Box className="modalStyle">
      <Typography
        id="modal-modal-title"
        variant="h6"
        component="h2"
        sx={{ fontWeight: "bold" }}
      >
        Adding new task
      </Typography>
      <Divider />
      <form onSubmit={createTask}>
        <Stack direction="column" spacing={2} sx={{ mb: 2, mt: 2 }}>
          <TextField
            id="task_name"
            required
            label="Task Name"
            variant="outlined"
            sx={{ mb: 2, mt: 2 }}
            value={name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              if (e.target.value.length <= 30) {
                setTaskName(e.target.value);
              }
            }}
          />
          <TextField
            id="task_description"
            required
            label="Task Description"
            multiline
            sx={{ mb: 2 }}
            value={description}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              if (e.target.value.length <= 200) {
                setTaskDescription(e.target.value);
              }
            }}
          />
        </Stack>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Start Date"
              value={start_date}
              onChange={(date) => setStartDate(date)}
            />
            <DatePicker
              label="Due Date"
              value={due_date}
              onChange={(date) => setDueDate(date)}
            />
          </LocalizationProvider>
        </Stack>

        <Divider />

        <Typography sx={{ color: "red", fontSize: "0.8rem", mb: 1, mt: 1 }}>
          {" "}
          *Files are optional.Only pdf files are allowed
        </Typography>

        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Button
            component="label"
            role={undefined}
            tabIndex={-1}
            startIcon={<FileUploadIcon />}
            sx={{ mb: 2, color: "#033f63" }}
            variant="outlined"
          >
            Upload
            <VisuallyHiddenInput type="file" onChange={handleFileChange} />
          </Button>

          {file && (
            <Typography sx={{ fontSize: "0.8rem", fontStyle: "italic" }}>
              Uploaded file: {file.name}
            </Typography>
          )}
        </Stack>

        <Divider sx={{ mb: 2 }} />

        <Typography>
          <Checkbox
            checked={submission_required}
            onChange={(event) => setSubmissionRequired(event.target.checked)}
          />
          {"Submission file required? "}
        </Typography>

        {subtasks.map((subtask, index) => (
          <Box key={index} sx={{ mb: 2, p: 2 }}>
            <Typography variant="h6">Subtask {index + 1}</Typography>
            <Stack direction="column" spacing={2} sx={{ mb: 2, mt: 2 }}>
              <TextField
                label="Title"
                required
                variant="outlined"
                sx={{ mb: 1, mt: 1 }}
                value={subtask.title}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  if (e.target.value.length <= 30) {
                    handleSubtaskChange(index, "title", e.target.value);
                  }
                }}
              />
              <TextField
                label="Description"
                variant="outlined"
                required
                multiline
                sx={{ mb: 1 }}
                value={subtask.description}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  if (e.target.value.length <= 200) {
                    handleSubtaskChange(index, "description", e.target.value);
                  }
                }}
              />
              <Box sx={{ display: "flex", alignItems: "center" }}></Box>
            </Stack>
            <IconButton
              color="secondary"
              onClick={() => removeSubtask(index)}
              disabled={subtasks.length === 1}
            >
              <RemoveIcon />
            </IconButton>
            {index === subtasks.length - 1 && (
              <IconButton color="primary" onClick={addSubtask}>
                <AddIcon />
              </IconButton>
            )}
          </Box>
        ))}

        <Button
          type="submit"
          variant="contained"
          sx={{ justifyContent: "center", width: "25%", margin: "auto" }}
        >
          Confirm
        </Button>
      </form>
    </Box>
  );
};

export default InsertTasks;
