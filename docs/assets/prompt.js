/**
 * Developer: Bashar Astifan 2023
 * Link: https://github.com/basharast
 */

var randomPositiveTokensColors = ["positive-1", "positive-2", "positive-3", "positive-4", "positive-5", "positive-6", "positive-7", "positive-8", "positive-9", "positive-10"];
function getRandomPositiveColor() {
    var index = Math.floor(Math.random() * randomPositiveTokensColors.length);
    return randomPositiveTokensColors[index];
}
var randomNegativeTokensColors = ["negative-1", "negative-2", "negative-3", "negative-4", "negative-5", "negative-6", "negative-7", "negative-8", "negative-9", "negative-10"];
function getRandomNegativeColor() {
    var index = Math.floor(Math.random() * randomNegativeTokensColors.length);
    return randomNegativeTokensColors[index];
}

function getRandomInvokeColor() {
    var index = Math.floor(Math.random() * randomPositiveTokensColors.length);
    return "invoke-" + randomPositiveTokensColors[index];
}

CodeMirror.defineSimpleMode("prompt-positive", {
    // The start state contains the rules that are initially used
    start: [
        // The regex matches the token, the token property contains the type
        { regex: /"(?:[^\\]|\\.)*?(?:"|$)/, token: "string" },
        // You can match multiple tokens at once. Note that the captured
        // groups must span the whole string in this case
        {
            regex: /(withLora)\((.*?,)/,
            token: ["lora", "lora-file"]
        },
        {
            regex: /(lora:)(.*?:)/,
            token: ["lora", "lora-file"]
        },
        {
            regex: /(lyco:)(.*?:)/,
            token: ["lora", "lora-file"]
        },
        {
            regex: /(?<!\w)(bright|colorful|cool|dark|deep|dusky|light|warm|iridescent|translucent)(?!\w)/,
            token: "color"
        },
        {
            regex: /(?<!\w)(candlelight|cinematic lighting|fire light|diffused|dramatic|soft lighting|neon lights|reflection|refraction|volumetric lighting)(?!\w)/,
            token: "lighting"
        },
        {
            regex: /(?<!\w)(brass|crystal|earth|glass|iron|magma|marble|porcelain|wood)(?!\w)/,
            token: "material"
        },
        {
            regex: /(?<!\w)(3d render|digital illustration|oil painting|pastel drawing|pencil sketch|pen and ink|sculpture|watercolor painting)(?!\w)/,
            token: "medium"
        },
        {
            regex: /(?<!\w)(backlighting|bloom|bokeh|broad light|chromatic aberration|shallow|deep depth of field|depth of field|fish-eye|smooth|sharp|shallow focus|god rays, sun rays, sun shafts|HDR|RAW color|wide-angle|tilt-shift|tone-mapped)(?!\w)/,
            token: "photography"
        },
        {
            regex: /(?<!\w)(4k|8k|exquisite|fine detail|best quality|low quality|highly detailed|masterpiece|Octane render|realistic|Unreal Engine)(?!\w)/,
            token: "quality"
        },
        {
            regex: /(?<!\w)(abstract|art nouveau|classical|gothic|graffiti|hyperrealism|modernism|realistic|surreal|photorealistic)(?!\w)/,
            token: "style"
        },
        {
            regex: /(?<!\w)(ancient|cyberpunk|futuristic|isometric|lush|medieval)(?!\w)/,
            token: "subject"
        },
        // Rules are matched in the order in which they appear, so there is
        // no ambiguity between this one and the one above
        {
            regex: /(?:function|var|return|if|for|while|else|do|this)\b/,
            token: "keyword"
        },
        { regex: /true|false|null|undefined/, token: "atom" },
        {
            regex: /0x[a-f\d]+|[-+]?(?:\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/i,
            token: "number"
        },
        { regex: /\/\/.*/, token: "comment" },
        { regex: /\/(?:[^\\]|\\.)*?\//, token: "variable-3" },
        // A next property will cause the mode to move to a different state
        { regex: /\/\*/, token: "comment", next: "comment" },
        { regex: /[-+\/*=<>!]+/, token: "operator" },
        { regex: /[\(\)]+/, token: "operator-2" },
        { regex: /[\[\]]+/, token: "decrease-1" },
        { regex: /[a-zA-Z][a-zA-Z0-9]*/, token: getRandomPositiveColor },
        // indent and dedent properties guide autoindentation
        { regex: /[\{\[\(]/, indent: true },
        { regex: /[\}\]\)]/, dedent: true },
        { regex: /[a-z$][\w$]*/, token: "variable" },
        // You can embed other modes with the mode property. This rule
        // causes all code between << and >> to be highlighted with the XML
        // mode.
        { regex: /<</, token: "meta", mode: { spec: "xml", end: />>/ } }
    ],
    // The multi-line comment state.
    comment: [
        { regex: /.*?\*\//, token: "comment", next: "start" },
        { regex: /.*/, token: "comment" }
    ],
    // The meta property contains global information about the mode. It
    // can contain properties like lineComment, which are supported by
    // all modes, and also directives like dontIndentStates, which are
    // specific to simple modes.
    meta: {
        dontIndentStates: ["comment"],
        lineComment: "//"
    }
});


CodeMirror.defineSimpleMode("prompt-negative", {
    // The start state contains the rules that are initially used
    start: [
        // The regex matches the token, the token property contains the type
        { regex: /"(?:[^\\]|\\.)*?(?:"|$)/, token: "string" },
        // You can match multiple tokens at once. Note that the captured
        // groups must span the whole string in this case
        {
            regex: /(withLora)\((.*?,)/,
            token: ["lora", "lora-file"]
        },
        {
            regex: /(lora:)(.*?:)/,
            token: ["lora", "lora-file"]
        },
        {
            regex: /(lyco:)(.*?:)/,
            token: ["lora", "lora-file"]
        },
        // Rules are matched in the order in which they appear, so there is
        // no ambiguity between this one and the one above
        {
            regex: /(?:function|var|return|if|for|while|else|do|this)\b/,
            token: "keyword"
        },
        { regex: /true|false|null|undefined/, token: "atom" },
        {
            regex: /0x[a-f\d]+|[-+]?(?:\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/i,
            token: "number"
        },
        { regex: /\/\/.*/, token: "comment" },
        { regex: /\/(?:[^\\]|\\.)*?\//, token: "variable-3" },
        // A next property will cause the mode to move to a different state
        { regex: /\/\*/, token: "comment", next: "comment" },
        { regex: /[-+\/*=<>!]+/, token: "operator" },
        { regex: /[\(\)]+/, token: "operator-2" },
        { regex: /[a-zA-Z][a-zA-Z0-9]*/, token: getRandomNegativeColor },
        { regex: /[\[\]]+/, token: "decrease-2" },
        // indent and dedent properties guide autoindentation
        { regex: /[\{\[\(]/, indent: true },
        { regex: /[\}\]\)]/, dedent: true },
        { regex: /[a-z$][\w$]*/, token: "variable" },
        // You can embed other modes with the mode property. This rule
        // causes all code between << and >> to be highlighted with the XML
        // mode.
        { regex: /<</, token: "meta", mode: { spec: "xml", end: />>/ } }
    ],
    // The multi-line comment state.
    comment: [
        { regex: /.*?\*\//, token: "comment", next: "start" },
        { regex: /.*/, token: "comment" }
    ],
    // The meta property contains global information about the mode. It
    // can contain properties like lineComment, which are supported by
    // all modes, and also directives like dontIndentStates, which are
    // specific to simple modes.
    meta: {
        dontIndentStates: ["comment"],
        lineComment: "//"
    }
});

var globalNegativeOpen = false;
CodeMirror.defineSimpleMode("prompt-invokeai", {
    // The start state contains the rules that are initially used
    start: [
        // The regex matches the token, the token property contains the type
        { regex: /"(?:[^\\]|\\.)*?(?:"|$)/, token: "string" },
        // You can match multiple tokens at once. Note that the captured
        // groups must span the whole string in this case
        {
            regex: /(withLora)\((.*?,)/,
            token: ["lora", "lora-file"]
        },
        {
            regex: /(lora:)(.*?:)/,
            token: ["lora", "lora-file"]
        },
        {
            regex: /(lyco:)(.*?:)/,
            token: ["lora", "lora-file"]
        },
        // Rules are matched in the order in which they appear, so there is
        // no ambiguity between this one and the one above
        {
            regex: /(?:function|var|return|if|for|while|else|do|this)\b/,
            token: "keyword"
        },
        { regex: /true|false|null|undefined/, token: "atom" },

        { regex: /\/\/.*/, token: "comment" },
        { regex: /\/(?:[^\\]|\\.)*?\//, token: "variable-3" },
        // A next property will cause the mode to move to a different state
        { regex: /\/\*/, token: "comment", next: "comment" },
        { regex: /[\(\)\+]+/, token: "operator-2" },
        {
            regex: /[a-zA-Z\[\]][a-zA-Z0-9]*/, token: function (stream) {
                var matchesOpen = stream[0].matchAll(/\[/g);
                var matchesClose = stream[0].matchAll(/\]/g);
                if ([...matchesOpen].length) {
                    globalNegativeOpen = true;
                    return "decrease-1";
                } else if ([...matchesClose].length) {
                    globalNegativeOpen = false;
                    return "decrease-1";
                }
                var tokenColor = getRandomInvokeColor();
                if (globalNegativeOpen) {
                    tokenColor = getRandomNegativeColor();
                }
                return tokenColor;
            }
        },
        { regex: /[\[\]\-]+/, token: "decrease-1" },
        {
            regex: /0x[a-f\d]+|[-+]?(?:\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/i,
            token: "number"
        },
        { regex: /[-+\/*=<>!]+/, token: "operator" },
        // indent and dedent properties guide autoindentation
        { regex: /[\{\[\(]/, indent: true },
        { regex: /[\}\]\)]/, dedent: true },
        { regex: /[a-z$][\w$]*/, token: "variable" },
        // You can embed other modes with the mode property. This rule
        // causes all code between << and >> to be highlighted with the XML
        // mode.
        { regex: /<</, token: "meta", mode: { spec: "xml", end: />>/ } }
    ],
    // The multi-line comment state.
    comment: [
        { regex: /.*?\*\//, token: "comment", next: "start" },
        { regex: /.*/, token: "comment" }
    ],
    // The meta property contains global information about the mode. It
    // can contain properties like lineComment, which are supported by
    // all modes, and also directives like dontIndentStates, which are
    // specific to simple modes.
    meta: {
        dontIndentStates: ["comment"],
        lineComment: "//"
    }
});