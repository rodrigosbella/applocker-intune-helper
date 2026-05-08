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

const translations = {
  en: {
    brand: "AppLocker Intune Helper",
    eyebrow: "Intune utility",
    title: "Generate AppLocker rules without hand-editing XML.",
    subtitle: "Paste an existing RuleCollection, add FilePath rules with GUIDs, and copy the final XML into an Intune Custom OMA-URI profile.",
    heroCardLabel: "Output",
    heroCardValue: "Intune-ready XML",
    heroCardHint: "Everything runs locally in the browser.",
    ruleInput: "Rule input",
    ruleInputHint: "Start with an existing RuleCollection or load a sample.",
    loadSample: "Load sample",
    existingXml: "Existing RuleCollection XML",
    collection: "Collection",
    action: "Action",
    sid: "User/group SID",
    ruleName: "Rule name",
    sidTips: "User/group SID tips",
    sidTipEveryone: "S-1-1-0 means Everyone.",
    sidTipAdmins: "S-1-5-32-544 means local Administrators.",
    sidTipCommand: "For an AD group, get the SID with PowerShell:",
    path: "Path",
    description: "Description",
    addRule: "Add FilePathRule",
    validateXml: "Validate XML",
    copyXml: "Copy XML",
    ready: "Ready",
    output: "Output",
    outputHint: "Use the suggested OMA-URI and paste the final XML into Intune.",
    clear: "Clear",
    omaUri: "Suggested OMA-URI",
    finalXml: "Final XML",
    ruleAdded: "Rule added.",
    xmlValid: "XML is valid.",
    xmlCopied: "XML copied.",
    outputCleared: "Output cleared.",
    noRuleCollection: "No RuleCollection element found.",
    pasteXmlFirst: "Paste XML first.",
    nothingToCopy: "Nothing to copy.",
    actionAllow: "Allow",
    actionDeny: "Deny",
  },
  pt: {
    brand: "AppLocker Intune Helper",
    eyebrow: "Utilit\u00e1rio para Intune",
    title: "Gere regras AppLocker sem editar XML no bra\u00e7o.",
    subtitle: "Cole uma RuleCollection existente, adicione regras FilePath com GUID e copie o XML final para um perfil Custom OMA-URI do Intune.",
    heroCardLabel: "Sa\u00edda",
    heroCardValue: "XML pronto para Intune",
    heroCardHint: "Tudo roda localmente no navegador.",
    ruleInput: "Entrada da regra",
    ruleInputHint: "Comece com uma RuleCollection existente ou carregue um exemplo.",
    loadSample: "Carregar exemplo",
    existingXml: "RuleCollection XML existente",
    collection: "Cole\u00e7\u00e3o",
    action: "A\u00e7\u00e3o",
    sid: "User/group SID",
    ruleName: "Nome da regra",
    sidTips: "Dicas sobre SID",
    sidTipEveryone: "S-1-1-0 significa Everyone/Todos.",
    sidTipAdmins: "S-1-5-32-544 significa Administradores locais.",
    sidTipCommand: "Para um grupo do AD, consulte o SID com PowerShell:",
    path: "Caminho",
    description: "Descri\u00e7\u00e3o",
    addRule: "Adicionar FilePathRule",
    validateXml: "Validar XML",
    copyXml: "Copiar XML",
    ready: "Pronto",
    output: "Sa\u00edda",
    outputHint: "Use o OMA-URI sugerido e cole o XML final no Intune.",
    clear: "Limpar",
    omaUri: "OMA-URI sugerido",
    finalXml: "XML final",
    ruleAdded: "Regra adicionada.",
    xmlValid: "XML v\u00e1lido.",
    xmlCopied: "XML copiado.",
    outputCleared: "Sa\u00edda limpa.",
    noRuleCollection: "Nenhum elemento RuleCollection foi encontrado.",
    pasteXmlFirst: "Cole o XML primeiro.",
    nothingToCopy: "N\u00e3o h\u00e1 nada para copiar.",
    actionAllow: "Permitir",
    actionDeny: "Negar",
  },
};

const omaUriByType = {
  EXE: "./Vendor/MSFT/AppLocker/ApplicationLaunchRestrictions/Apps/EXE/Policy",
  DLL: "./Vendor/MSFT/AppLocker/ApplicationLaunchRestrictions/Apps/DLL/Policy",
  MSI: "./Vendor/MSFT/AppLocker/ApplicationLaunchRestrictions/Apps/MSI/Policy",
  Script: "./Vendor/MSFT/AppLocker/ApplicationLaunchRestrictions/Apps/Script/Policy",
  StoreApps: "./Vendor/MSFT/AppLocker/ApplicationLaunchRestrictions/Apps/StoreApps/Policy",
};

const state = {
  lang: "pt",
  parser: new DOMParser(),
  serializer: new XMLSerializer(),
};

const $ = (id) => document.getElementById(id);

function t(key) {
  return translations[state.lang][key];
}

function setStatus(message, kind = "") {
  const inline = $("inlineResult");
  inline.textContent = message;
  inline.className = `inline-result ${kind}`.trim();
}

function applyLanguage(lang) {
  state.lang = lang;
  document.documentElement.lang = lang === "pt" ? "pt-BR" : "en";
  const actionSelect = $("action");
  actionSelect.querySelector('option[value="Allow"]').textContent = t("actionAllow");
  actionSelect.querySelector('option[value="Deny"]').textContent = t("actionDeny");
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === lang);
  });
  renderCustomSelect("collectionType");
  renderCustomSelect("action");
  setStatus(t("ready"));
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
  if (error) throw new Error(error.textContent || "Invalid XML");
  return doc;
}

function getRuleCollection(doc) {
  if (doc.documentElement?.tagName === "RuleCollection") return doc.documentElement;
  const collection = doc.querySelector("RuleCollection");
  if (!collection) throw new Error(t("noRuleCollection"));
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
  setStatus(t("ruleAdded"), "ok");
}

function validateXml() {
  const xmlText = $("xmlOutput").value.trim() || $("xmlInput").value.trim();
  if (!xmlText) throw new Error(t("pasteXmlFirst"));
  parseXml(xmlText);
  setStatus(t("xmlValid"), "ok");
}

async function copyToClipboard(value) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const temp = document.createElement("textarea");
  temp.value = value;
  temp.setAttribute("readonly", "");
  temp.style.position = "fixed";
  temp.style.left = "-9999px";
  document.body.appendChild(temp);
  temp.select();
  document.execCommand("copy");
  document.body.removeChild(temp);
}

async function copyXml() {
  const value = $("xmlOutput").value.trim() || $("xmlInput").value.trim();
  if (!value) throw new Error(t("nothingToCopy"));
  await copyToClipboard(value);
  setStatus(t("xmlCopied"), "ok");
}

function renderCustomSelect(id) {
  const select = $(id);
  let wrapper = document.querySelector(`[data-select-wrapper="${id}"]`);

  if (!wrapper) {
    wrapper = document.createElement("div");
    wrapper.className = "custom-select";
    wrapper.dataset.selectWrapper = id;
    select.insertAdjacentElement("afterend", wrapper);
  }

  const selected = select.options[select.selectedIndex]?.textContent || "";
  wrapper.innerHTML = `
    <button type="button" class="select-button" aria-haspopup="listbox" aria-expanded="false">${selected}</button>
    <div class="select-menu" role="listbox">
      ${Array.from(select.options).map((option) => `
        <button type="button" class="select-option ${option.selected ? "active" : ""}" data-value="${option.value}" role="option" aria-selected="${option.selected}">
          ${option.textContent}
        </button>
      `).join("")}
    </div>
  `;

  const button = wrapper.querySelector(".select-button");
  button.addEventListener("click", () => {
    document.querySelectorAll(".custom-select.open").forEach((openSelect) => {
      if (openSelect !== wrapper) openSelect.classList.remove("open");
    });
    wrapper.classList.toggle("open");
    button.setAttribute("aria-expanded", wrapper.classList.contains("open") ? "true" : "false");
  });

  wrapper.querySelectorAll(".select-option").forEach((optionButton) => {
    optionButton.addEventListener("click", () => {
      select.value = optionButton.dataset.value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      wrapper.classList.remove("open");
      renderCustomSelect(id);
    });
  });
}

function init() {
  $("loadSample").addEventListener("click", () => {
    $("xmlInput").value = sampleXml;
    $("xmlOutput").value = "";
    setStatus(t("ready"), "ok");
  });

  $("collectionType").addEventListener("change", () => {
    updateOmaUri();
    renderCustomSelect("collectionType");
  });
  $("action").addEventListener("change", () => renderCustomSelect("action"));
  $("addRule").addEventListener("click", () => run(addRule));
  $("validateXml").addEventListener("click", () => run(validateXml));
  $("copyXml").addEventListener("click", () => run(copyXml));
  $("clearOutput").addEventListener("click", () => {
    $("xmlOutput").value = "";
    setStatus(t("outputCleared"));
  });

  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.addEventListener("click", () => applyLanguage(button.dataset.lang));
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".custom-select")) {
      document.querySelectorAll(".custom-select.open").forEach((wrapper) => wrapper.classList.remove("open"));
    }
  });

  updateOmaUri();
  renderCustomSelect("collectionType");
  renderCustomSelect("action");
  applyLanguage("pt");
}

async function run(fn) {
  try {
    await fn();
  } catch (error) {
    setStatus(error.message, "error");
  }
}

init();
