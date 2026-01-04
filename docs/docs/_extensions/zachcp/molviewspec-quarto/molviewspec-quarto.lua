-- MolViewSpec Quarto Filter
-- Processes molviewspec code blocks and creates interactive MolStar viewers

local counter = 0
local dependencies_added = false

-- Function to add HTML dependencies (JS and CSS)
local function add_dependencies()
  if dependencies_added then
    return
  end

  -- Only add dependencies if quarto global is available
  if quarto and quarto.doc and quarto.doc.addHtmlDependency then
    -- Add bundled molviewspec assets (all-in-one compiled bundle)
    -- Monaco configuration must run before module loads
    quarto.doc.addHtmlDependency({
      name = "molviewspec-quarto",
      version = "1.1.0",
      head = [[
<script>
// Configure Monaco Environment before loading modules
window.MonacoEnvironment = {
  getWorkerUrl: function(moduleId, label) {
    // Determine base path from script location
    var scripts = document.getElementsByTagName('script');
    var basePath = '';
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].src;
      if (src && src.indexOf('molviewspec') !== -1) {
        basePath = src.substring(0, src.lastIndexOf('/') + 1);
        break;
      }
    }
    if (label === 'typescript' || label === 'javascript') {
      return basePath + 'assets/ts.worker.js';
    }
    return basePath + 'assets/editor.worker.js';
  }
};
</script>
]],
      scripts = {
        { path = "assets/molstar.js" },
        { path = "molviewspec.js", attribs = {type = "module"} }
      },
      stylesheets = {
        "assets/molstar.css",
        "assets/molstar-components.css",
        "molviewspec.css",
        "molviewspec-custom.css"
      },
      resources = {
        { name = "assets/molstar.js", path = "assets/molstar.js" },
        { name = "assets/molstar.css", path = "assets/molstar.css" },
        { name = "assets/editor.worker.js", path = "assets/editor.worker.js" },
        { name = "assets/ts.worker.js", path = "assets/ts.worker.js" }
      }
    })
  end

  dependencies_added = true
end

-- Function to generate unique ID
local function generate_id()
  counter = counter + 1
  return "molviewspec-" .. counter
end

-- Process CodeBlock elements
function CodeBlock(el)
  -- Check if this is a molviewspec code block
  if el.classes:includes("molviewspec") then

    -- Only process for HTML output (check if quarto global exists)
    if quarto and quarto.doc then
      if not quarto.doc.isFormat("html") then
        -- For non-HTML formats, return the original code block
        return el
      end
    end

    -- Add dependencies on first use
    add_dependencies()

    -- Generate unique ID for this instance
    local id = generate_id()

    -- Get the code content (JavaScript builder code)
    local content = el.text

    -- Split content into story code and scene code using "---" as delimiter
    local story_code = ""
    local scene_code = content
    local separator_pos = content:find("\n%-%-%-\n")

    if separator_pos then
      story_code = content:sub(1, separator_pos - 1)
      scene_code = content:sub(separator_pos + 5) -- Skip past "\n---\n"
    end

    -- Get optional attributes
    local height = el.attributes.height or "400px"
    local width = el.attributes.width or "100%"
    local title = el.attributes.title or ""

    -- Build component props from attributes
    -- Extract all EditorWithViewer props
    local props = {}

    -- Track if we need extra height for bottom controls
    local has_bottom_controls = false

    -- String props
    if el.attributes.layout then props.layout = el.attributes.layout end
    if el.attributes.editorHeight then props.editorHeight = el.attributes.editorHeight end
    if el.attributes.viewerHeight then props.viewerHeight = el.attributes.viewerHeight end

    -- Boolean props (convert string "true"/"false" to boolean)
    if el.attributes.autoRun then
      props.autoRun = el.attributes.autoRun == "true"
    end

    -- Simplified controls option - when enabled, shows bottom control panel with toggles
    -- showLog must be true to enable the log toggle functionality
    -- The log visibility is then controlled by the user via the toggle
    if el.attributes.controls then
      local controls_enabled = el.attributes.controls == "true"
      if controls_enabled then
        props.showBottomControlPanel = true
        props.showAutoUpdateToggle = true
        props.showLog = true  -- Must be true for log toggle to work
        has_bottom_controls = true
      end
    end

    -- Number props
    if el.attributes.autoRunDelay then
      props.autoRunDelay = tonumber(el.attributes.autoRunDelay)
    end

    -- Convert props table to JSON string
    local json_props = "{"
    local first = true
    for key, value in pairs(props) do
      if not first then
        json_props = json_props .. ","
      end
      first = false

      json_props = json_props .. string.format('"%s":', key)
      if type(value) == "string" then
        json_props = json_props .. string.format('"%s"', value:gsub('"', '\\"'))
      elseif type(value) == "boolean" then
        json_props = json_props .. (value and "true" or "false")
      elseif type(value) == "number" then
        json_props = json_props .. tostring(value)
      end
    end
    json_props = json_props .. "}"

    -- Build inline styles - omit height if bottom controls are enabled (let it be responsive)
    local inline_style = has_bottom_controls and string.format("width: %s;", width) or string.format("height: %s; width: %s;", height, width)

    -- Create HTML structure with separate script tags for story and scene code
    local html = string.format([[
<div class="molviewspec-container" id="%s" style="%s">
  %s
  <script type="application/json" id="%s-story">%s</script>
  <script type="application/json" id="%s-scene">%s</script>
  <script type="application/json" id="%s-props">%s</script>
  <div class="molviewspec-viewer" id="%s-viewer"></div>
</div>
]], id, inline_style,
    title ~= "" and string.format('<div class="molviewspec-header"><h4 class="molviewspec-title">%s</h4></div>', title) or "",
    id, story_code,
    id, scene_code,
    id, json_props,
    id)

    -- Return as raw HTML block
    return pandoc.RawBlock('html', html)
  end

  -- Return unchanged if not a molviewspec block
  return el
end

-- Return filter function
return {
  { CodeBlock = CodeBlock }
}
