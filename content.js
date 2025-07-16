chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "formatJson") {
    try {
      console.log(message);
      showJsonModal(message.selectedText);
    } catch (e) {
      alert("Invalid JSON: " + e.message);
    }
  }
});

function showJsonModal(jsonData) {
  // Remove existing modal if present
  const existingModal = document.getElementById("json-viewer-modal");
  if (existingModal) existingModal.remove();

  // Create dialog element
  const dialog = document.createElement("dialog");
  dialog.id = "json-viewer-modal";
  dialog.style.width = "70vw";
  dialog.style.maxHeight = "80vh";
  dialog.style.overflow = "auto";
  dialog.style.padding = "0";
  dialog.style.border = "none";
  dialog.style.borderRadius = "8px";
  dialog.style.boxShadow = "0 2px 16px rgba(0,0,0,0.3)";

  // Modal content container
  const container = document.createElement("div");
  container.style.padding = "1.5em";
  container.style.position = "relative";
  container.style.backgroundColor = "#ffffff";

  // Header
  const header = document.createElement("div");
  header.style.display = "flex";
  header.style.justifyContent = "space-between";
  header.style.alignItems = "center";
  header.style.marginBottom = "1em";
  header.style.borderBottom = "1px solid #e0e0e0";
  header.style.paddingBottom = "0.5em";

  const title = document.createElement("h3");
  title.textContent = "JSON Viewer";
  title.style.margin = "0";
  title.style.fontSize = "1.2em";
  title.style.color = "#333";

  // Controls container
  const controls = document.createElement("div");
  controls.style.display = "flex";
  controls.style.gap = "10px";
  controls.style.alignItems = "center";

  // Expand/Collapse all buttons
  const expandAllBtn = document.createElement("button");
  expandAllBtn.textContent = "Expand All";
  expandAllBtn.style.padding = "0.3em 0.8em";
  expandAllBtn.style.fontSize = "12px";
  expandAllBtn.style.backgroundColor = "#28a745";
  expandAllBtn.style.color = "white";
  expandAllBtn.style.border = "none";
  expandAllBtn.style.borderRadius = "4px";
  expandAllBtn.style.cursor = "pointer";

  const collapseAllBtn = document.createElement("button");
  collapseAllBtn.textContent = "Collapse All";
  collapseAllBtn.style.padding = "0.3em 0.8em";
  collapseAllBtn.style.fontSize = "12px";
  collapseAllBtn.style.backgroundColor = "#dc3545";
  collapseAllBtn.style.color = "white";
  collapseAllBtn.style.border = "none";
  collapseAllBtn.style.borderRadius = "4px";
  collapseAllBtn.style.cursor = "pointer";

  // Close button
  const closeBtn = document.createElement("button");
  closeBtn.textContent = "×";
  closeBtn.style.fontSize = "1.5em";
  closeBtn.style.background = "transparent";
  closeBtn.style.border = "none";
  closeBtn.style.cursor = "pointer";
  closeBtn.style.color = "#666";
  closeBtn.style.padding = "0";
  closeBtn.style.width = "30px";
  closeBtn.style.height = "30px";
  closeBtn.style.display = "flex";
  closeBtn.style.alignItems = "center";
  closeBtn.style.justifyContent = "center";
  closeBtn.style.borderRadius = "50%";
  closeBtn.setAttribute("aria-label", "Close");
  closeBtn.onclick = () => dialog.close();

  // Hover effect for close button
  closeBtn.onmouseover = () => {
    closeBtn.style.backgroundColor = "#f0f0f0";
  };
  closeBtn.onmouseout = () => {
    closeBtn.style.backgroundColor = "transparent";
  };

  controls.appendChild(expandAllBtn);
  controls.appendChild(collapseAllBtn);
  controls.appendChild(closeBtn);

  header.appendChild(title);
  header.appendChild(controls);

  // JSON container
  const jsonContainer = document.createElement("div");
  jsonContainer.style.maxHeight = "60vh";
  jsonContainer.style.overflow = "auto";
  jsonContainer.style.border = "1px solid #e0e0e0";
  jsonContainer.style.borderRadius = "4px";
  jsonContainer.style.backgroundColor = "#f8f9fa";
  jsonContainer.style.padding = "1em";

  try {
    // Parse JSON
    const parsed = JSON.parse(jsonData);

    // Create collapsible JSON tree
    const jsonTree = createCollapsibleJsonTree(parsed);
    jsonContainer.appendChild(jsonTree);

    // Add event listeners for expand/collapse all
    expandAllBtn.onclick = () => expandAll(jsonContainer);
    collapseAllBtn.onclick = () => collapseAll(jsonContainer);
  } catch (e) {
    // If parsing fails, display as plain text
    const errorDiv = document.createElement("div");
    errorDiv.textContent = "Invalid JSON: " + e.message;
    errorDiv.style.color = "#d32f2f";
    errorDiv.style.fontFamily =
      "Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace";
    jsonContainer.appendChild(errorDiv);
  }

  container.appendChild(header);
  container.appendChild(jsonContainer);
  dialog.appendChild(container);

  document.body.appendChild(dialog);
  dialog.showModal();

  dialog.addEventListener("close", () => dialog.remove());
}

function createCollapsibleJsonTree(obj, key = null, level = 0) {
  const container = document.createElement("div");
  container.style.marginLeft = level * 20 + "px";
  container.style.fontFamily =
    "Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace";
  container.style.fontSize = "14px";
  container.style.lineHeight = "1.4";

  if (obj === null) {
    container.innerHTML = createKeyValueHtml(
      key,
      '<span class="null">null</span>'
    );
    return container;
  }

  if (typeof obj !== "object") {
    const value = formatPrimitiveValue(obj);
    container.innerHTML = createKeyValueHtml(key, value);
    return container;
  }

  const isArray = Array.isArray(obj);
  const entries = isArray
    ? obj.map((item, index) => [index, item])
    : Object.entries(obj);

  if (entries.length === 0) {
    const emptyValue = isArray
      ? '<span class="bracket">[]</span>'
      : '<span class="bracket">{}</span>';
    container.innerHTML = createKeyValueHtml(key, emptyValue);
    return container;
  }

  // Create collapsible header
  const header = document.createElement("div");
  header.style.cursor = "pointer";
  header.style.userSelect = "none";
  header.style.display = "flex";
  header.style.alignItems = "center";
  header.style.gap = "5px";

  const toggleIcon = document.createElement("span");
  toggleIcon.textContent = "▼";
  toggleIcon.style.fontSize = "12px";
  toggleIcon.style.color = "#666";
  toggleIcon.style.transition = "transform 0.2s";
  toggleIcon.classList.add("toggle-icon");

  const headerContent = document.createElement("span");
  const openBracket = isArray ? "[" : "{";
  const closeBracket = isArray ? "]" : "}";
  const count = entries.length;
  const itemText = isArray ? "items" : "properties";

  headerContent.innerHTML = createKeyValueHtml(
    key,
    `<span class="bracket">${openBracket}</span> <span class="count">${count} ${itemText}</span>`
  );

  header.appendChild(toggleIcon);
  header.appendChild(headerContent);

  // Create collapsible content
  const content = document.createElement("div");
  content.classList.add("collapsible-content");

  entries.forEach(([entryKey, entryValue], index) => {
    const child = createCollapsibleJsonTree(entryValue, entryKey, level + 1);

    // Add comma except for last item
    if (index < entries.length - 1) {
      const comma = document.createElement("span");
      comma.textContent = ",";
      comma.style.color = "#666";
      child.appendChild(comma);
    }

    content.appendChild(child);
  });

  // Add closing bracket
  const closingBracket = document.createElement("div");
  closingBracket.style.marginLeft = level * 20 + "px";
  closingBracket.style.fontFamily =
    "Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace";
  closingBracket.innerHTML = `<span class="bracket">${closeBracket}</span>`;
  content.appendChild(closingBracket);

  // Toggle functionality
  let isCollapsed = false;
  header.onclick = () => {
    isCollapsed = !isCollapsed;
    if (isCollapsed) {
      content.style.display = "none";
      toggleIcon.style.transform = "rotate(-90deg)";
      headerContent.innerHTML = createKeyValueHtml(
        key,
        `<span class="bracket">${openBracket}...${closeBracket}</span> <span class="count">${count} ${itemText}</span>`
      );
    } else {
      content.style.display = "block";
      toggleIcon.style.transform = "rotate(0deg)";
      headerContent.innerHTML = createKeyValueHtml(
        key,
        `<span class="bracket">${openBracket}</span> <span class="count">${count} ${itemText}</span>`
      );
    }
  };

  container.appendChild(header);
  container.appendChild(content);

  return container;
}

function createKeyValueHtml(key, value) {
  if (key === null) {
    return value;
  }
  return `<span class="key">"${key}"</span><span class="colon">:</span> ${value}`;
}

function formatPrimitiveValue(value) {
  if (typeof value === "string") {
    return `<span class="string">"${escapeHtml(value)}"</span>`;
  }
  if (typeof value === "number") {
    return `<span class="number">${value}</span>`;
  }
  if (typeof value === "boolean") {
    return `<span class="boolean">${value}</span>`;
  }
  return `<span class="unknown">${value}</span>`;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function expandAll(container) {
  const toggleIcons = container.querySelectorAll(".toggle-icon");
  const contents = container.querySelectorAll(".collapsible-content");

  toggleIcons.forEach((icon) => {
    icon.style.transform = "rotate(0deg)";
  });

  contents.forEach((content) => {
    content.style.display = "block";
  });

  // Update header texts
  container.querySelectorAll("div").forEach((div) => {
    if (div.onclick && div.textContent.includes("...")) {
      div.click();
      div.click(); // Double click to ensure expanded state
    }
  });
}

function collapseAll(container) {
  const toggleIcons = container.querySelectorAll(".toggle-icon");
  const contents = container.querySelectorAll(".collapsible-content");

  toggleIcons.forEach((icon) => {
    icon.style.transform = "rotate(-90deg)";
  });

  contents.forEach((content) => {
    content.style.display = "none";
  });
}

// Add CSS for syntax highlighting and collapsible elements
const style = document.createElement("style");
style.textContent = `
  #json-viewer-modal .string { color: #d32f2f; }
  #json-viewer-modal .number { color: #1976d2; }
  #json-viewer-modal .boolean { color: #388e3c; }
  #json-viewer-modal .null { color: #757575; }
  #json-viewer-modal .key { color: #7b1fa2; font-weight: bold; }
  #json-viewer-modal .bracket { color: #666; font-weight: bold; }
  #json-viewer-modal .colon { color: #666; margin: 0 5px; }
  #json-viewer-modal .count { color: #666; font-style: italic; font-size: 12px; }
  #json-viewer-modal .collapsible-content { margin-left: 0; }
  #json-viewer-modal .toggle-icon:hover { color: #333; }
`;
document.head.appendChild(style);
