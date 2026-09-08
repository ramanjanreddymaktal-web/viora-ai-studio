const BACKEND_URL = "https://viora-ai-studio.onrender.com";

async function demoGenerate() {
  const promptBox = document.getElementById("prompt");
  const job = document.getElementById("job");
  const text = promptBox.value.trim();

  if (!text) {
    alert("Please enter a prompt first.");
    promptBox.focus();
    return;
  }

  job.classList.remove("hidden");
  const title = job.querySelector("b");
  const desc = job.querySelector("p");
  const spinner = job.querySelector(".spinner");

  if (spinner) spinner.style.display = "block";
  title.textContent = "Generating your video...";
  desc.textContent = "This can take a few minutes.";

  try {
    const response = await fetch(`${BACKEND_URL}/generate`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({prompt: text})
    });

    if (!response.ok) {
      let errorMessage = `Generation failed (${response.status})`;
      try {
        const data = await response.json();
        errorMessage = data.detail || errorMessage;
      } catch (_) {}
      throw new Error(errorMessage);
    }

    const blob = await response.blob();
    if (!blob.type.includes("video")) {
      throw new Error("The backend did not return a video file.");
    }

    const videoUrl = URL.createObjectURL(blob);
    let video = document.getElementById("resultVideo");

    if (!video) {
      video = document.createElement("video");
      video.id = "resultVideo";
      video.controls = true;
      video.playsInline = true;
      video.style.width = "100%";
      video.style.borderRadius = "18px";

      const preview = document.querySelector(".preview") ||
                      document.querySelector(".previewBox");
      if (preview) {
        preview.innerHTML = "";
        preview.appendChild(video);
      }
    }

    video.src = videoUrl;
    video.style.display = "block";
    if (spinner) spinner.style.display = "none";
    title.textContent = "Video generated successfully";
    desc.textContent = "Your video is ready.";
    video.play().catch(() => {});
  } catch (error) {
    if (spinner) spinner.style.display = "none";
    title.textContent = "Generation failed";
    desc.textContent = error.message;
  }
}
