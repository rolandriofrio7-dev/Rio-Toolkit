// ============================================================
//  RIO TOOLS — One-Click Workflow Panel for After Effects
//  Version: 1.0
//
//  INSTALL:
//    Mac: /Applications/Adobe After Effects [ver]/Scripts/ScriptUI Panels/
//    Win: C:\Program Files\Adobe\Adobe After Effects [ver]\
//           Support Files\Scripts\ScriptUI Panels\
//    → Restart AE, then open via:  Window > Rio_Tools.jsx
//
//  CUSTOMIZE:
//    Colors       → edit the C{} block (~line 55)
//    Button sizes → edit BTN_H / BTN_W constants in each section
//    Sections     → each section is clearly labelled below
// ============================================================

(function (thisObj) {

    var VERSION = "1.0";

    // ============================================================
    //  COLORS  —  all values are 0.0–1.0 for ScriptUI
    //  Edit any entry here to retheme the entire panel.
    // ============================================================
    var C = {
        // Backgrounds
        bg:           [0.110, 0.110, 0.130],   // Root bg          #1C1C21
        cardBg:       [0.145, 0.145, 0.168],   // Section card     #252530
        inputBg:      [0.090, 0.090, 0.108],   // Input fields     #171720
        headerBg:     [0.090, 0.090, 0.112],   // Header block     #17171D

        // Accent palette
        accent:       [0.278, 0.561, 1.000],   // Primary blue     #4790FF
        accentDim:    [0.180, 0.360, 0.700],   // Muted blue       #2E5CB3
        accentGreen:  [0.220, 0.800, 0.490],   // Mint green       #38CC7D
        accentOrange: [1.000, 0.500, 0.180],   // Warm orange      #FF802E
        accentPurple: [0.600, 0.380, 1.000],   // Violet           #9961FF
        accentRed:    [0.900, 0.280, 0.280],   // Soft red         #E64848

        // Text
        textPrimary:  [0.920, 0.922, 0.961],   // Near-white       #EBEBF5
        textSecondary:[0.560, 0.560, 0.620],   // Muted label      #8F8F9E
        textDim:      [0.360, 0.360, 0.410],   // Very dim         #5C5C69

        // Borders
        border:       [0.210, 0.210, 0.258],   // Divider line     #363642
        borderLight:  [0.270, 0.270, 0.330],   // Lighter border   #454554
    };

    // ============================================================
    //  UTILITY — pen / brush shortcuts
    // ============================================================
    function pen(g, color, alpha)  { return g.newPen  (g.PenType.SOLID_COLOR,   color, alpha  || 1); }
    function brush(g, color, alpha){ return g.newBrush(g.BrushType.SOLID_COLOR, color, alpha  || 1); }

    // Apply a foreground color to a statictext/button if possible
    function setFG(el, color) {
        try { el.graphics.foregroundColor = pen(el.graphics, color); } catch(e) {}
    }
    function setFont(el, style, size) {
        try { el.graphics.font = ScriptUI.newFont("Arial", style, size); } catch(e) {}
    }

    // ============================================================
    //  LAYOUT HELPERS
    // ============================================================

    // Thin horizontal separator
    function hr(parent, topM, botM) {
        var w = parent.add("group");
        w.orientation = "row";
        w.alignChildren = ["fill", "center"];
        w.margins = [0, topM || 2, 0, botM || 2];
        w.add("panel").alignment = "fill";
    }

    // Section header: colored ▌ bar + bold label
    // color: optional accent color array; defaults to C.accent
    function sectionHead(parent, title, color) {
        var g = parent.add("group");
        g.orientation = "row";
        g.alignChildren = ["left", "center"];
        g.margins = [13, 7, 13, 3];
        g.spacing = 6;

        var bar = g.add("statictext", undefined, "\u258C");
        setFont(bar, "BOLD", 11);
        setFG(bar, color || C.accent);

        var lbl = g.add("statictext", undefined, title.toUpperCase());
        setFont(lbl, "BOLD", 9);
        setFG(lbl, C.textSecondary);
    }

    // ============================================================
    //  AE SCRIPTING HELPERS
    // ============================================================

    // Returns active CompItem or shows alert + returns null
    function getComp() {
        var c = app.project.activeItem;
        if (!c || !(c instanceof CompItem)) {
            alert("Rio Tools\n\nNo active composition found.\nOpen or click inside a composition first.");
            return null;
        }
        return c;
    }

    // Returns selected layers array or shows alert + returns null
    function getSelectedLayers(comp) {
        var layers = comp.selectedLayers;
        if (!layers || layers.length === 0) {
            alert("Rio Tools\n\nNo layers selected.\nSelect at least one layer in the timeline.");
            return null;
        }
        return layers;
    }

    // Wrap a function in undo group; returns false on thrown error
    function withUndo(label, fn) {
        app.beginUndoGroup("Rio Tools: " + label);
        try { fn(); } catch(e) { alert("Rio Tools Error\n\n" + e.toString()); }
        app.endUndoGroup();
    }

    // ============================================================
    //  ACTION IMPLEMENTATIONS
    // ============================================================

    // ── ALIGNMENT ──────────────────────────────────────────────

    // Align selected layers to a position in the comp.
    // hAlign: "left" | "center" | "right"
    // vAlign: "top"  | "middle" | "bottom"
    function alignLayers(hAlign, vAlign) {
        var comp = getComp(); if (!comp) return;
        var layers = getSelectedLayers(comp); if (!layers) return;
        withUndo("Align Layers", function () {
            var cw = comp.width, ch = comp.height;
            for (var i = 0; i < layers.length; i++) {
                var lay = layers[i];
                // Use the layer's current position (2D or 3D)
                var pos = lay.property("ADBE Position").value;
                var is3D = lay.threeDLayer;

                // Get layer bounding info via source dimensions when available
                var lw = 0, lh = 0;
                try {
                    if (lay.source) {
                        lw = lay.source.width  * lay.property("ADBE Scale").value[0] / 100;
                        lh = lay.source.height * lay.property("ADBE Scale").value[1] / 100;
                    }
                } catch(e) {}

                // Anchor offset from layer top-left corner
                var anchor = lay.property("ADBE Anchor Point").value;
                var anchorOffX = anchor[0] * lay.property("ADBE Scale").value[0] / 100;
                var anchorOffY = anchor[1] * lay.property("ADBE Scale").value[1] / 100;

                var newX = pos[0], newY = pos[1];

                if      (hAlign === "left")   newX = anchorOffX;
                else if (hAlign === "center") newX = cw / 2;
                else if (hAlign === "right")  newX = cw - (lw - anchorOffX);

                if      (vAlign === "top")    newY = anchorOffY;
                else if (vAlign === "middle") newY = ch / 2;
                else if (vAlign === "bottom") newY = ch - (lh - anchorOffY);

                if (is3D) {
                    lay.property("ADBE Position").setValue([newX, newY, pos[2]]);
                } else {
                    lay.property("ADBE Position").setValue([newX, newY]);
                }
            }
        });
    }

    // ── PRE-COMP ───────────────────────────────────────────────
    function preCompSelected() {
        var comp = getComp(); if (!comp) return;
        var layers = getSelectedLayers(comp); if (!layers) return;
        withUndo("Pre-Comp Selected", function () {
            // Select layers in AE's internal model, then call pre-compose
            // AE's app.executeCommand(2071) triggers "Pre-compose" for selected layers
            app.executeCommand(2071);
        });
    }

    // ── CENTER IN COMP ─────────────────────────────────────────
    function centerInComp() {
        var comp = getComp(); if (!comp) return;
        var layers = getSelectedLayers(comp); if (!layers) return;
        withUndo("Center In Comp", function () {
            for (var i = 0; i < layers.length; i++) {
                var lay = layers[i];
                var pos = lay.property("ADBE Position").value;
                if (lay.threeDLayer) {
                    lay.property("ADBE Position").setValue([comp.width / 2, comp.height / 2, pos[2]]);
                } else {
                    lay.property("ADBE Position").setValue([comp.width / 2, comp.height / 2]);
                }
            }
        });
    }

    // ── SAVE CURRENT FRAME ─────────────────────────────────────
    // NOTE: AE Scripting cannot directly trigger "Export Frame" from the
    // Composition menu. The safest scriptable approach is to add a render
    // queue item set to a single frame and alert the user to render it.
    // A render queue render via app.project.renderQueue.render() requires
    // a valid output path, which varies per machine. We give the user a
    // clear prompt instead. If you want fully automated export, use the
    // AE ExtendScript renderQueue API with a fixed output path.
    function saveCurrentFrame() {
        var comp = getComp(); if (!comp) return;
        withUndo("Save Current Frame", function () {
            var rq  = app.project.renderQueue;
            var rqi = rq.items.add(comp);
            rqi.timeSpanStart    = comp.time;
            rqi.timeSpanDuration = 1 / comp.frameRate;

            var om = rqi.outputModule(1);
            // Set to PNG sequence — user can change output module in Render Queue
            om.applyTemplate("_HIDDEN");
            try { om.applyTemplate("Photoshop"); } catch(e) {}

            alert("Rio Tools — Save Current Frame\n\n" +
                  "A render queue item has been added for the current frame.\n\n" +
                  "Please:\n" +
                  "  1. Open the Render Queue  (Window > Render Queue)\n" +
                  "  2. Set your output path\n" +
                  "  3. Click Render\n\n" +
                  "(AE scripting cannot auto-set output paths — " +
                  "this is an Adobe limitation.)");
        });
    }

    // ── FREEZE FRAME ───────────────────────────────────────────
    function freezeFrame() {
        var comp = getComp(); if (!comp) return;
        var layers = getSelectedLayers(comp); if (!layers) return;
        withUndo("Freeze Frame", function () {
            for (var i = 0; i < layers.length; i++) {
                var lay = layers[i];
                try {
                    // Enable frame blending off, then enable time remapping
                    lay.timeRemapEnabled = true;
                    var tr = lay.property("ADBE Time Remapping");
                    var currentTime = comp.time;
                    // Set two keyframes at the same value to freeze
                    var frameVal = tr.valueAtTime(currentTime, false);
                    tr.setValueAtTime(currentTime, frameVal);
                    // Extend to out point
                    if (lay.outPoint > currentTime) {
                        tr.setValueAtTime(lay.outPoint, frameVal);
                    }
                    // Set both to hold keyframes
                    var numKeys = tr.numKeys;
                    if (numKeys >= 1) {
                        tr.setInterpolationTypeAtKey(numKeys, KeyframeInterpolationType.HOLD, KeyframeInterpolationType.HOLD);
                    }
                } catch(e) {
                    alert("Freeze Frame failed on layer \"" + lay.name + "\":\n" + e.toString());
                }
            }
        });
    }

    // ── FIT TO COMP ────────────────────────────────────────────
    function fitToComp() {
        var comp = getComp(); if (!comp) return;
        var layers = getSelectedLayers(comp); if (!layers) return;
        withUndo("Fit To Comp", function () {
            for (var i = 0; i < layers.length; i++) {
                var lay = layers[i];
                try {
                    var src = lay.source;
                    if (!src) continue;
                    var scaleX = (comp.width  / src.width)  * 100;
                    var scaleY = (comp.height / src.height) * 100;
                    // Uniform scale — use the smaller ratio so content fits inside
                    var scale  = Math.min(scaleX, scaleY);
                    if (lay.threeDLayer) {
                        lay.property("ADBE Scale").setValue([scale, scale, scale]);
                    } else {
                        lay.property("ADBE Scale").setValue([scale, scale]);
                    }
                    // Re-center
                    if (lay.threeDLayer) {
                        var pos = lay.property("ADBE Position").value;
                        lay.property("ADBE Position").setValue([comp.width / 2, comp.height / 2, pos[2]]);
                    } else {
                        lay.property("ADBE Position").setValue([comp.width / 2, comp.height / 2]);
                    }
                } catch(e) { /* layer has no source (e.g. text/solid) — skip */ }
            }
        });
    }

    // ── MIRROR LAYER ───────────────────────────────────────────
    // Duplicates the selected layer and flips it horizontally.
    function mirrorLayer() {
        var comp = getComp(); if (!comp) return;
        var layers = getSelectedLayers(comp); if (!layers) return;
        withUndo("Mirror Layer", function () {
            for (var i = 0; i < layers.length; i++) {
                var orig = layers[i];
                var dup  = orig.duplicate();
                var sc   = dup.property("ADBE Scale").value;
                // Flip X axis
                if (sc.length >= 2) {
                    sc[0] = -sc[0];
                    dup.property("ADBE Scale").setValue(sc);
                }
            }
        });
    }

    // ── ADD ADJUSTMENT LAYER ───────────────────────────────────
    function addAdjustmentLayer() {
        var comp = getComp(); if (!comp) return;
        withUndo("Add Adjustment Layer", function () {
            var solid = comp.layers.addSolid(
                [0, 0, 0], "Adjustment Layer", comp.width, comp.height, comp.pixelAspect
            );
            solid.adjustmentLayer = true;
            solid.name = "Adjustment Layer";
        });
    }

    // ── ADD SOLID ──────────────────────────────────────────────
    function addSolid() {
        var comp = getComp(); if (!comp) return;
        withUndo("Add Solid", function () {
            comp.layers.addSolid([0.2, 0.2, 0.2], "Solid", comp.width, comp.height, comp.pixelAspect);
        });
    }

    // ── ADD NULL ───────────────────────────────────────────────
    function addNull() {
        var comp = getComp(); if (!comp) return;
        withUndo("Add Null", function () {
            var n = comp.layers.addNull();
            n.name = "Null";
        });
    }

    // ── ADD SHAPE LAYER ────────────────────────────────────────
    function addShapeLayer() {
        var comp = getComp(); if (!comp) return;
        withUndo("Add Shape Layer", function () {
            comp.layers.addShape();
        });
    }

    // ── ADD TEXT LAYER ─────────────────────────────────────────
    function addTextLayer() {
        var comp = getComp(); if (!comp) return;
        withUndo("Add Text Layer", function () {
            var txt = comp.layers.addText("New Text");
            txt.name = "Text Layer";
        });
    }

    // ── ADD CAMERA ─────────────────────────────────────────────
    function addCamera() {
        var comp = getComp(); if (!comp) return;
        withUndo("Add Camera", function () {
            comp.layers.addCamera("Camera", [comp.width / 2, comp.height / 2]);
        });
    }

    // ── ADD LIGHT ──────────────────────────────────────────────
    function addLight() {
        var comp = getComp(); if (!comp) return;
        withUndo("Add Light", function () {
            comp.layers.addLight("Point Light", [comp.width / 2, comp.height / 2]);
        });
    }

    // ── EFFECTS — generic applier ──────────────────────────────
    // matchName: internal AE effect match name string
    // label:     human name for alert messages
    function applyEffect(matchName, label) {
        var comp = getComp(); if (!comp) return;
        var layers = getSelectedLayers(comp); if (!layers) return;
        withUndo("Add " + label, function () {
            for (var i = 0; i < layers.length; i++) {
                try {
                    layers[i].property("ADBE Effect Parade").addProperty(matchName);
                } catch(e) {
                    alert("Could not add \"" + label + "\" to layer \"" + layers[i].name + "\".\n" +
                          "This effect may not be available in your version of After Effects.");
                }
            }
        });
    }

    // Convenience wrappers for each effect
    // To add a new effect: find its matchName via the AE scripting docs
    // or by running: app.project.activeItem.selectedLayers[0].property("Effects").addProperty("your search term")
    function addFill()            { applyEffect("ADBE Fill",              "Fill");              }
    function addTint()            { applyEffect("ADBE Tint",              "Tint");              }
    function addGaussianBlur()    { applyEffect("ADBE Gaussian Blur 2",   "Gaussian Blur");     }
    function addCameraLensBlur()  { applyEffect("ADBE Camera Lens Blur",  "Camera Lens Blur");  }
    function addCurves()          { applyEffect("ADBE CurvesCustom",      "Curves");            }
    function addLumetriColor()    { applyEffect("ADBE Lumetri Color",     "Lumetri Color");     }
    function addDropShadow()      { applyEffect("ADBE Drop Shadow",       "Drop Shadow");       }
    function addGlow()            { applyEffect("ADBE Glow",              "Glow");              }
    function addHueSaturation()   { applyEffect("ADBE HUE SATURATION",    "Hue/Saturation");    }
    function addLevels()          { applyEffect("ADBE Levels",            "Levels");            }
    function addBrightnessContrast() { applyEffect("ADBE Brightness & Contrast 2", "Brightness & Contrast"); }
    function addChromaKey()       { applyEffect("ADBE Keylight",          "Keylight (1.2)");    }
    function addMotionBlur()      {
        // Motion blur isn't an effect — it's a layer switch
        var comp = getComp(); if (!comp) return;
        var layers = getSelectedLayers(comp); if (!layers) return;
        withUndo("Enable Motion Blur", function () {
            comp.motionBlur = true;
            for (var i = 0; i < layers.length; i++) {
                try { layers[i].motionBlur = true; } catch(e) {}
            }
        });
    }

    // ── SETTINGS PLACEHOLDER ───────────────────────────────────
    function showSettings() {
        alert("Rio Tools — Settings\n\n" +
              "Settings panel coming in a future version.\n\n" +
              "To customize colors, button sizes, and order:\n" +
              "  Open Rio_Tools.jsx in a text editor and edit:\n" +
              "    • C{} block for colors\n" +
              "    • BTN_H / BTN_W constants for button sizing\n" +
              "    • Each section's button definitions");
    }

    // ── HELP ───────────────────────────────────────────────────
    function showHelp() {
        alert("Rio Tools v" + VERSION + " — Help\n\n" +
              "ALIGN section:\n" +
              "  Select layer(s) → click an alignment button\n" +
              "  to snap them to that comp position.\n\n" +
              "CREATE section:\n" +
              "  Click any button to add a new layer/element\n" +
              "  to the active composition.\n\n" +
              "MODIFY section:\n" +
              "  Select layer(s) first, then click an action.\n\n" +
              "EFFECTS section:\n" +
              "  Select layer(s) → click an effect button\n" +
              "  to apply that effect to all selected layers.\n\n" +
              "EXPORT section:\n" +
              "  Save Current Frame adds a render queue item\n" +
              "  for the current comp time; render from\n" +
              "  Window > Render Queue.\n\n" +
              "TIP: All actions support Ctrl+Z / Cmd+Z undo.");
    }

    // ============================================================
    //  BUILD UI
    // ============================================================
    function buildUI(root) {

        root.orientation   = "column";
        root.alignChildren = ["fill", "top"];
        root.spacing       = 0;
        root.margins       = 0;

        // ── Button factory ──────────────────────────────────────
        // Creates a consistently styled button.
        // accent: optional [r,g,b] to tint the label text
        function makeBtn(parent, label, tip, onClick, accent) {
            var btn = parent.add("button", undefined, label);
            btn.helpTip      = tip || label;
            btn.onClick      = onClick || function(){};
            // ScriptUI doesn't allow custom bg on buttons,
            // but we can style the text color for accent buttons
            if (accent) { setFG(btn, accent); }
            return btn;
        }

        // ── Section wrapper with consistent inner padding ───────
        function section(parent, padLR, padTB) {
            var g = parent.add("group");
            g.orientation   = "column";
            g.alignChildren = ["fill", "top"];
            g.margins       = [padLR || 12, padTB || 2, padLR || 12, padTB || 8];
            g.spacing       = 5;
            return g;
        }

        // ── Grid row factory ────────────────────────────────────
        function gridRow(parent, spacing) {
            var row = parent.add("group");
            row.orientation   = "row";
            row.alignChildren = ["fill", "center"];
            row.spacing       = spacing || 5;
            return row;
        }

        // ══════════════════════════════════════════════════════
        //  HEADER
        // ══════════════════════════════════════════════════════

        // Top accent strip (3 px blue line at very top)
        var topStrip = root.add("panel");
        topStrip.alignment   = "fill";
        topStrip.minimumSize = [-1, 3];
        topStrip.maximumSize = [-1, 3];

        // Header: [RIO logo] | [title + subtitle] ........... [⚙] [?]
        var headerRow = root.add("group");
        headerRow.orientation   = "row";
        headerRow.alignChildren = ["fill", "center"];
        headerRow.margins       = [13, 10, 10, 10];
        headerRow.spacing       = 9;

        // RIO logotype
        var rioLbl = headerRow.add("statictext", undefined, "RIO");
        setFont(rioLbl, "BOLD", 20);
        setFG(rioLbl, C.accent);

        // Vertical divider
        var vDiv = headerRow.add("panel");
        vDiv.preferredSize = [1, 28];
        vDiv.minimumSize   = [1, 28];
        vDiv.maximumSize   = [1, 28];

        // Title stack
        var titleStack = headerRow.add("group");
        titleStack.orientation   = "column";
        titleStack.alignChildren = ["left", "center"];
        titleStack.spacing       = 2;

        var toolsLbl = titleStack.add("statictext", undefined, "TOOLS");
        setFont(toolsLbl, "BOLD", 14);
        setFG(toolsLbl, C.textPrimary);

        var subLbl = titleStack.add("statictext", undefined, "One-click tools for faster edits");
        setFont(subLbl, "REGULAR", 8);
        setFG(subLbl, C.textDim);

        // Spacer
        var spacer = headerRow.add("group");
        spacer.alignment = ["fill", "center"];

        // Settings + Help buttons (compact, icon-like)
        var headerBtnRow = headerRow.add("group");
        headerBtnRow.orientation   = "row";
        headerBtnRow.alignChildren = ["right", "center"];
        headerBtnRow.spacing       = 4;

        var settingsBtn = headerBtnRow.add("button", undefined, "\u2699"); // ⚙
        settingsBtn.preferredSize = [26, 22];
        settingsBtn.helpTip = "Settings — customize Rio Tools";
        settingsBtn.onClick = showSettings;

        var helpBtn = headerBtnRow.add("button", undefined, "?");
        helpBtn.preferredSize = [26, 22];
        helpBtn.helpTip = "Help — how to use Rio Tools";
        helpBtn.onClick = showHelp;

        hr(root, 0, 0);

        // ══════════════════════════════════════════════════════
        //  SECTION 1 — ALIGN
        //  3×3 grid of alignment buttons.
        //  BTN_ALIGN_H: height of each align button (px)
        // ══════════════════════════════════════════════════════
        var BTN_ALIGN_H = 26; // ← customize alignment button height

        sectionHead(root, "Align", C.accent);
        var alignSection = section(root, 12, 2);

        // Row 1: Top Left / Top Center / Top Right
        var aRow1 = gridRow(alignSection);
        makeBtn(aRow1, "Top Left",    "Align to top-left of comp",    function(){ alignLayers("left",   "top");    });
        makeBtn(aRow1, "Top Center",  "Align to top-center of comp",  function(){ alignLayers("center", "top");    });
        makeBtn(aRow1, "Top Right",   "Align to top-right of comp",   function(){ alignLayers("right",  "top");    });
        aRow1.children[0].preferredSize = [-1, BTN_ALIGN_H];
        aRow1.children[1].preferredSize = [-1, BTN_ALIGN_H];
        aRow1.children[2].preferredSize = [-1, BTN_ALIGN_H];

        // Row 2: Middle Left / Center In Comp / Middle Right
        var aRow2 = gridRow(alignSection);
        makeBtn(aRow2, "Middle Left",    "Align to vertical center, left edge",  function(){ alignLayers("left",   "middle"); });
        makeBtn(aRow2, "Center In Comp", "Center layer in composition",          function(){ centerInComp();                  });
        makeBtn(aRow2, "Middle Right",   "Align to vertical center, right edge", function(){ alignLayers("right",  "middle"); });
        aRow2.children[0].preferredSize = [-1, BTN_ALIGN_H];
        aRow2.children[1].preferredSize = [-1, BTN_ALIGN_H];
        aRow2.children[2].preferredSize = [-1, BTN_ALIGN_H];
        setFG(aRow2.children[1], C.accent); // highlight Center button

        // Row 3: Bottom Left / Bottom Center / Bottom Right
        var aRow3 = gridRow(alignSection);
        makeBtn(aRow3, "Bottom Left",   "Align to bottom-left of comp",   function(){ alignLayers("left",   "bottom"); });
        makeBtn(aRow3, "Bottom Center", "Align to bottom-center of comp", function(){ alignLayers("center", "bottom"); });
        makeBtn(aRow3, "Bottom Right",  "Align to bottom-right of comp",  function(){ alignLayers("right",  "bottom"); });
        aRow3.children[0].preferredSize = [-1, BTN_ALIGN_H];
        aRow3.children[1].preferredSize = [-1, BTN_ALIGN_H];
        aRow3.children[2].preferredSize = [-1, BTN_ALIGN_H];

        hr(root, 3, 0);

        // ══════════════════════════════════════════════════════
        //  SECTION 2 — CREATE
        //  Buttons that add new elements to the active comp.
        //  BTN_CREATE_H: height of each create button (px)
        // ══════════════════════════════════════════════════════
        var BTN_CREATE_H = 26; // ← customize create button height

        sectionHead(root, "Create", C.accentGreen);
        var createSection = section(root, 12, 2);

        var cRow1 = gridRow(createSection);
        makeBtn(cRow1, "Add Solid",        "Add a new solid layer",         addSolid,        C.accentGreen).preferredSize = [-1, BTN_CREATE_H];
        makeBtn(cRow1, "Add Shape Layer",  "Add a new empty shape layer",   addShapeLayer,   C.accentGreen).preferredSize = [-1, BTN_CREATE_H];
        makeBtn(cRow1, "Add Text Layer",   "Add a new text layer",          addTextLayer,    C.accentGreen).preferredSize = [-1, BTN_CREATE_H];

        var cRow2 = gridRow(createSection);
        makeBtn(cRow2, "Add Null",         "Add a null object layer",       addNull,         C.accentGreen).preferredSize = [-1, BTN_CREATE_H];
        makeBtn(cRow2, "Add Camera",       "Add a new camera layer",        addCamera,       C.accentGreen).preferredSize = [-1, BTN_CREATE_H];
        makeBtn(cRow2, "Add Light",        "Add a point light layer",       addLight,        C.accentGreen).preferredSize = [-1, BTN_CREATE_H];

        var cRow3 = gridRow(createSection);
        makeBtn(cRow3, "Add Adjustment Layer", "Add an adjustment layer",   addAdjustmentLayer, C.accentGreen).preferredSize = [-1, BTN_CREATE_H];

        hr(root, 3, 0);

        // ══════════════════════════════════════════════════════
        //  SECTION 3 — MODIFY
        //  Actions that transform or restructure existing layers.
        //  BTN_MOD_H: height of each modify button (px)
        // ══════════════════════════════════════════════════════
        var BTN_MOD_H = 26; // ← customize modify button height

        sectionHead(root, "Modify", C.accentOrange);
        var modSection = section(root, 12, 2);

        var mRow1 = gridRow(modSection);
        makeBtn(mRow1, "Pre-Comp Selected", "Pre-compose selected layers",  preCompSelected, C.accentOrange).preferredSize = [-1, BTN_MOD_H];
        makeBtn(mRow1, "Center In Comp",    "Move selected layers to comp center", centerInComp, C.accentOrange).preferredSize = [-1, BTN_MOD_H];

        var mRow2 = gridRow(modSection);
        makeBtn(mRow2, "Fit To Comp",       "Scale layer to fit inside comp",       fitToComp,    C.accentOrange).preferredSize = [-1, BTN_MOD_H];
        makeBtn(mRow2, "Mirror Layer",      "Duplicate and flip layer horizontally", mirrorLayer,  C.accentOrange).preferredSize = [-1, BTN_MOD_H];

        var mRow3 = gridRow(modSection);
        makeBtn(mRow3, "Freeze Frame",      "Time-remap layer to freeze at current frame", freezeFrame,  C.accentOrange).preferredSize = [-1, BTN_MOD_H];
        makeBtn(mRow3, "Enable Motion Blur","Turn on motion blur for selected layers", addMotionBlur, C.accentOrange).preferredSize = [-1, BTN_MOD_H];

        hr(root, 3, 0);

        // ══════════════════════════════════════════════════════
        //  SECTION 4 — EFFECTS
        //  Apply effects to selected layers.
        //  BTN_FX_H: height of each effect button (px)
        //  To add a new effect button, copy one of the makeBtn
        //  lines below and change the label + function.
        // ══════════════════════════════════════════════════════
        var BTN_FX_H = 24; // ← customize effects button height

        sectionHead(root, "Effects", C.accentPurple);
        var fxSection = section(root, 12, 2);

        // Color & grading
        var fxRow1 = gridRow(fxSection);
        makeBtn(fxRow1, "Lumetri Color",    "Apply Lumetri Color effect",       addLumetriColor,        C.accentPurple).preferredSize = [-1, BTN_FX_H];
        makeBtn(fxRow1, "Curves",           "Apply Curves effect",              addCurves,              C.accentPurple).preferredSize = [-1, BTN_FX_H];
        makeBtn(fxRow1, "Hue / Saturation", "Apply Hue/Saturation effect",      addHueSaturation,       C.accentPurple).preferredSize = [-1, BTN_FX_H];

        var fxRow2 = gridRow(fxSection);
        makeBtn(fxRow2, "Levels",           "Apply Levels effect",              addLevels,              C.accentPurple).preferredSize = [-1, BTN_FX_H];
        makeBtn(fxRow2, "Brightness & Contrast", "Apply Brightness & Contrast", addBrightnessContrast, C.accentPurple).preferredSize = [-1, BTN_FX_H];
        makeBtn(fxRow2, "Tint",             "Apply Tint effect",                addTint,                C.accentPurple).preferredSize = [-1, BTN_FX_H];

        // Stylize & utility
        var fxRow3 = gridRow(fxSection);
        makeBtn(fxRow3, "Fill",             "Apply Fill effect (solid color)",   addFill,               C.accentPurple).preferredSize = [-1, BTN_FX_H];
        makeBtn(fxRow3, "Glow",             "Apply Glow effect",                 addGlow,               C.accentPurple).preferredSize = [-1, BTN_FX_H];
        makeBtn(fxRow3, "Drop Shadow",      "Apply Drop Shadow effect",          addDropShadow,         C.accentPurple).preferredSize = [-1, BTN_FX_H];

        // Blur
        var fxRow4 = gridRow(fxSection);
        makeBtn(fxRow4, "Gaussian Blur",    "Apply Gaussian Blur effect",        addGaussianBlur,       C.accentPurple).preferredSize = [-1, BTN_FX_H];
        makeBtn(fxRow4, "Camera Lens Blur", "Apply Camera Lens Blur effect",     addCameraLensBlur,     C.accentPurple).preferredSize = [-1, BTN_FX_H];
        makeBtn(fxRow4, "Keylight (Chroma)","Apply Keylight 1.2 chroma key",     addChromaKey,          C.accentPurple).preferredSize = [-1, BTN_FX_H];

        hr(root, 3, 0);

        // ══════════════════════════════════════════════════════
        //  SECTION 5 — EXPORT
        // ══════════════════════════════════════════════════════
        var BTN_EXP_H = 26; // ← customize export button height

        sectionHead(root, "Export", C.accentRed);
        var expSection = section(root, 12, 2);

        var eRow1 = gridRow(expSection);
        makeBtn(eRow1, "Save Current Frame",
            "Add a render queue item for the current frame (then render from Render Queue)",
            saveCurrentFrame, C.accentRed
        ).preferredSize = [-1, BTN_EXP_H];

        // ── Placeholder for future export actions ──
        // To add more export buttons, add makeBtn lines here.

        // ══════════════════════════════════════════════════════
        //  FOOTER
        // ══════════════════════════════════════════════════════
        hr(root, 2, 0);

        var footer = root.add("group");
        footer.orientation   = "row";
        footer.alignChildren = ["fill", "center"];
        footer.margins       = [13, 4, 13, 5];
        footer.spacing       = 5;

        // Green "online" dot
        var dotLbl = footer.add("statictext", undefined, "\u25CF");
        setFont(dotLbl, "REGULAR", 7);
        setFG(dotLbl, C.accentGreen);

        var footerLbl = footer.add("statictext", undefined, "Rio Tools v" + VERSION + "  \u2014  select items then click any action");
        setFont(footerLbl, "REGULAR", 8);
        setFG(footerLbl, C.textDim);

        return root;
    }

    // ============================================================
    //  ENTRY POINT — docked panel or floating palette
    // ============================================================
    var panel;
    if (thisObj instanceof Panel) {
        panel = thisObj;
        panel.orientation   = "column";
        panel.alignChildren = ["fill", "top"];
        panel.spacing       = 0;
        panel.margins       = 0;
        buildUI(panel);
        panel.layout.layout(true);
    } else {
        panel = new Window("palette", "Rio Tools  v" + VERSION, undefined, { resizeable: true });
        panel.orientation   = "column";
        panel.alignChildren = ["fill", "top"];
        panel.spacing       = 0;
        panel.margins       = 0;
        buildUI(panel);
        panel.layout.layout(true);
        panel.center();
        panel.show();
    }

})(this);

// ============================================================
//  INSTALLATION
// ============================================================
//
//  1. Save this file as:
//       Rio_Tools.jsx
//
//  2. Copy to the ScriptUI Panels folder:
//
//     macOS:
//       /Applications/Adobe After Effects [version]/
//         Scripts/ScriptUI Panels/Rio_Tools.jsx
//
//     Windows:
//       C:\Program Files\Adobe\Adobe After Effects [version]\
//         Support Files\Scripts\ScriptUI Panels\Rio_Tools.jsx
//
//  3. Restart After Effects.
//
//  4. Window > Rio_Tools.jsx — dock it anywhere.
//
// ── USAGE ────────────────────────────────────────────────────
//
//  ALIGN   → Select layer(s), click an alignment button
//  CREATE  → Click to add new layers to the active comp
//  MODIFY  → Select layer(s), click to transform or restructure
//  EFFECTS → Select layer(s), click to apply effect(s)
//  EXPORT  → Click to add a render queue item for current frame
//
//  All actions support Cmd+Z / Ctrl+Z undo.
//
// ── CUSTOMIZATION ────────────────────────────────────────────
//
//  Colors      → edit the C{} object near the top
//  Btn heights → find BTN_ALIGN_H / BTN_CREATE_H / BTN_MOD_H /
//                BTN_FX_H / BTN_EXP_H constants in buildUI()
//  New effects → copy any makeBtn line in the EFFECTS section
//                and change the label + effect function
//  New buttons → add a new applyEffect() wrapper function then
//                a makeBtn() call in the appropriate section
//
// ============================================================
