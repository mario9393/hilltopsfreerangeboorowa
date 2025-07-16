
document.getElementById("paymentForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);
  const photoFile = formData.get("letterPhoto");

  const reader = new FileReader();
  reader.onloadend = async function () {
    const base64Photo = reader.result;

    const payload = {
      company: formData.get("company"),
      description: formData.get("description"),
      dueDate: formData.get("dueDate"),
      status: formData.get("status"),
      submittedBy: formData.get("submittedBy"),
      letterPhoto: base64Photo
    };

    await fetch("YOUR_WEB_APP_URL", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json"
      }
    });

    alert("Form submitted successfully!");
    form.reset();
  };

  if (photoFile) {
    reader.readAsDataURL(photoFile);
  }
});
