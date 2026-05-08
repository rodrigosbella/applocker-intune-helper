const sampleXml = `<RuleCollection Type="Exe" EnforcementMode="Enabled">
  <FilePathRule Id="921cc481-6e17-4653-8f75-050b80acca20" Name="Default rule - Program Files" Description="Allows everyone to run applications in Program Files." UserOrGroupSid="S-1-1-0" Action="Allow">
    <Conditions>
      <FilePathCondition Path="%PROGRAMFILES%\\*" />
    </Conditions>
  </FilePathRule>
  <FilePathRule Id="a61c8b2c-a319-4cd0-9690-d2177cad7b51" Name="Default rule - Windows" Description="Allows everyone to run applications in Windows." UserOrGroupSid="S-1-1-0" Action="Allow">
    <Conditions>
      <FilePathCondition Path="%WINDIR%\\*" />
    </Conditions>
  </FilePathRule>
  <FilePathRule Id="fd686d83-a829-4351-8ff4-27c7de5755d2" Name="Default rule - Administrators" Description="Allows local administrators to run all applications." UserOrGroupSid="S-1-5-32-544" Action="Allow">
    <Conditions>
      <FilePathCondition Path="*" />
    </Conditions>
  </FilePathRule>
</RuleCollection>`;

const omaUriByType = {
  EXE: "./Vendor/MSFT/AppLocker/ApplicationLaunchRestrictions/Apps/EXE/Policy",
  DLL: "./Vendor/MSFT/AppLocker/ApplicationLaunchRestrictions/Apps/DLL/Policy",
  MSI: "./Vendor/MSFT/AppLocker/ApplicationLaunchRestrictions/Apps/MSI/Policy",
  Script: "./Vendor/MSFT/AppLocker/ApplicationLaunchRestrictions/Apps/Script/Policy",
  StoreApps: "./Vendor/MSFT/AppLocker/ApplicationLaunchRestrictions/Apps/StoreApps/Policy",
};

const $ = (id) => document.getElementById(id);

const state = {
  parser: new DOMParser(),
  serializer: new XMLSerializer(),
};

function setStatus(message, kind = "") {
  const status = $("status");
  const inline = $("inlineResult");
  status.textContent = message;
  status.className = `status ${kind}`.trim();
  inline.textContent = message;
  inline.className = `inline-result ${kind}`.trim();
}

function formatXml(xml) {
  const compact = xml.replace(/>\s+</g, "><").trim();
  let formatted = "";
  let indent = 0;

  compact.split(/(?=<)/g).forEach((node) => {
    if (!node) return;
    if (node.startsWith("</")) indent = Math.max(indent - 1, 0);
    formatted += `${"  ".repeat(indent)}${node}\n`;
    if (node.startsWith("<") && !node.startsWith("</") && !node.endsWith("/>") && !node.includes("</")) {
      indent += 1;
    }
  });

  return formatted.trim();
}

function parseXml(xmlText) {
  const doc = state.parser.parseFromString(xmlText, "application/xml");
  const error = doc.querySelector("parsererror");
  if (error) {
    throw new Error(error.textContent || "Invalid XML");
  }
  return doc;
}

function getRuleCollection(doc) {
  if (doc.documentElement?.tagName === "RuleCollection") {
    return doc.documentElement;
  }
  const collection = doc.querySelector("RuleCollection");
  if (!collection) {
    throw new Error("No RuleCollection element found.");
  }
  return collection;
}

function makeGuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const value = Math.floor(Math.random() * 16);
    return (char === "x" ? value : (value & 0x3) | 0x8).toString(16);
  });
}

function updateOmaUri() {
  $("omaUri").value = omaUriByType[$("collectionType").value] || "";
}

function buildRule(doc) {
  const rule = doc.createElement("FilePathRule");
  rule.setAttribute("Id", makeGuid());
  rule.setAttribute("Name", $("ruleName").value.trim() || "Generated FilePathRule");
  rule.setAttribute("Description", $("description").value.trim());
  rule.setAttribute("UserOrGroupSid", $("sid").value.trim() || "S-1-1-0");
  rule.setAttribute("Action", $("action").value);

  const conditions = doc.createElement("Conditions");
  const pathCondition = doc.createElement("FilePathCondition");
  pathCondition.setAttribute("Path", $("pathInput").value.trim());
  conditions.appendChild(pathCondition);
  rule.appendChild(conditions);
  return rule;
}

function addRule() {
  const xmlText = $("xmlInput").value.trim() || sampleXml;
  const doc = parseXml(xmlText);
  const collection = getRuleCollection(doc);
  collection.setAttribute("Type", $("collectionType").value);
  collection.appendChild(buildRule(doc));
  const output = formatXml(state.serializer.serializeToString(doc));
  $("xmlOutput").value = output;
  $("xmlInput").value = output;
  setStatus("Rule added", "ok");
}

function validateXml() {
  const xmlText = $("xmlOutput").value.trim() || $("xmlInput").value.trim();
  if (!xmlText) throw new Error("Paste XML first.");
  parseXml(xmlText);
  setStatus("XML is valid", "ok");
}

async function copyXml() {
  const value = $("xmlOutput").value.trim() || $("xmlInput").value.trim();
  if (!value) throw new Error("Nothing to copy.");
  await navigator.clipboard.writeText(value);
  setStatus("XML copied", "ok");
}

function wireEvents() {
  $("loadSample").addEventListener("click", () => {
    $("xmlInput").value = sampleXml;
    $("xmlOutput").value = "";
    setStatus("Sample loaded", "ok");
  });

  $("collectionType").addEventListener("change", updateOmaUri);
  $("addRule").addEventListener("click", () => run(addRule));
  $("validateXml").addEventListener("click", () => run(validateXml));
  $("copyXml").addEventListener("click", () => run(copyXml));
  $("clearOutput").addEventListener("click", () => {
    $("xmlOutput").value = "";
    setStatus("Output cleared");
  });
}

async function run(fn) {
  try {
    await fn();
  } catch (error) {
    setStatus(error.message, "error");
  }
}

wireEvents();
updateOmaUri();
