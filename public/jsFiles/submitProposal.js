document.addEventListener("DOMContentLoaded", () => {
  const coverLetter = document.getElementById("coverLetter");
  const expectedPay = document.getElementById("expectedPay");

  // Add a live character counter for the cover letter
  coverLetter.addEventListener("input", () => {
    const maxLength = 500;
    const remaining = maxLength - coverLetter.value.length;
    if (!document.querySelector(".char-counter")) {
      const counter = document.createElement("small");
      counter.className = "char-counter";
      counter.style.display = "block";
      counter.style.marginTop = "5px";
      counter.style.color = remaining < 0 ? "red" : "#666";
      coverLetter.parentNode.appendChild(counter);
    }
    const counter = document.querySelector(".char-counter");
    counter.textContent = `${remaining} characters remaining`;
    counter.style.color = remaining < 0 ? "red" : "#666";
  });

  // Validate expected payment input
  expectedPay.addEventListener("input", () => {
    if (expectedPay.value < 0) {
      expectedPay.setCustomValidity("Payment cannot be negative.");
    } else {
      expectedPay.setCustomValidity("");
    }
  });
});
