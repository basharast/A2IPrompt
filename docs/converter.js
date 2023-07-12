/**
 * Developer: Bashar Astifan 2023
 * Link: https://github.com/basharast
 * License: Free, Not for commercial use!
 */

//Main prompt syntax resolver table
var defaultWeight = 0.91;
var regexConversionTable = {
    invokeAIRegexPatterns: [
        {
            inputRegex: [String.raw`\{([^\}]+)\}`, String.raw`\[([^\]]+)\]`, String.raw`(?<!withLora)\(([^\)(?!\\)]+)\)`],
            outputRegex: function (inputText, regexGroups) {
                for (const match of regexGroups) {
                    var fullMatch = match[0];
                    var innerMatch = match[1];
                    if (innerMatch.indexOf("|") !== -1) {
                        var groups = innerMatch.split("|");
                        var outputElements = [];
                        groups.forEach(function (groupItem) {
                            var appendValue = "";
                            groupItem = groupItem.trim();
                            var possibleWeightSplits = ["@", ":"];
                            possibleWeightSplits.forEach(function (splitItem) {
                                if (groupItem.indexOf(splitItem) !== -1) {
                                    var itemData = groupItem.split(splitItem);
                                    var itemText = itemData[0];
                                    var itemWeight = itemData[1];
                                    appendValue = `(${itemText})${itemWeight}`;
                                }
                            });
                            if (appendValue.length == 0) {
                                appendValue = `(${groupItem})${defaultWeight}`;
                            }
                            outputElements.push(appendValue);
                        });
                        var blendText = "(" + outputElements.join(", ") + ")";
                        inputText = inputText.replace(fullMatch, blendText);
                    }
                }
                return inputText;
            },
            outputNegativeRegex: "$1",
            outputNegativeRawRegex: "$1",
            recursiveCheck: false
        },
        {
            inputRegex: String.raw`!#([^)]+)#!(?![\-\+\d])\:([\d\.]+)`,
            outputRegex: "(($1)$2)@",
            outputNegativeRegex: "(($1)$2)!",
            outputNegativeRawRegex: "$1",
            recursiveCheck: true,
            replacementsMap:
            {
                loopCount: 10,
                replacements: [
                    { target: "!#", replacement: String.raw`\(`, output: false },
                    { target: "#!", replacement: String.raw`\)`, output: false },
                    { target: "@", replacement: "+", output: true },
                    { target: "!", replacement: "-", output: true },
                ]
            },
        },
        {
            inputRegex: String.raw`(?<!withLora)!#([^)(?!\\)]+)#!(?![\-\+\d])`,
            outputRegex: "($1)@",
            outputNegativeRegex: "($1)!",
            outputNegativeRawRegex: "$1",
            recursiveCheck: true,
            replacementsMap:
            {
                loopCount: 10,
                replacements: [
                    { target: "!#", replacement: String.raw`\(`, output: false },
                    { target: "#!", replacement: String.raw`\)`, output: false },
                    { target: "@", replacement: "+", output: true },
                    { target: "!", replacement: "-", output: true },
                ]
            },
        },
        {
            inputRegex: String.raw`\<lora:(.*?):\s{0,3}([\d\.]+)\>`,
            outputRegex: "withLora($1,$2)",
            outputNegativeRegex: "",
            outputNegativeRawRegex: "",
            recursiveCheck: false
        },
        {
            inputRegex: String.raw`\<lyco:(.*?):\s{0,3}([\d\.]+)\>`,
            outputRegex: "withLora($1,$2)",
            outputNegativeRegex: "",
            outputNegativeRawRegex: "",
            recursiveCheck: false
        },
        {
            inputRegex: String.raw`(?!\s)([a-zA-Z\s\_]+)[\s]{0,3}\:\s{0,3}([\d\.]+)`,
            outputRegex: "($1)$2",
            outputNegativeRegex: "($1)$2",
            outputNegativeRawRegex: "$1",
            recursiveCheck: false
        },
        {
            inputRegex: String.raw`\[([^[]+)\](?![\+\d])`,
            outputRegex: `($1)${defaultWeight}`,
            outputNegativeRegex: `($1)${defaultWeight}`,
            outputNegativeRawRegex: "$1",
            recursiveCheck: false
        },
        {
            inputRegex: String.raw`(::[\d\.]+)`,
            outputRegex: "", //No idea currently
            outputNegativeRegex: "",
            outputNegativeRawRegex: "",
            recursiveCheck: false
        },
        {
            inputRegex: String.raw`(\):([\d\.]+))`,
            outputRegex: ")$2",
            outputNegativeRegex: ")$2",
            outputNegativeRawRegex: ")$2",
            recursiveCheck: false
        },
        {
            inputRegex: String.raw`(\+:([\d\.]+))`,
            outputRegex: "$2",
            outputNegativeRegex: "$2",
            outputNegativeRawRegex: "$2",
            recursiveCheck: false
        },
        {
            inputRegex: String.raw`(\\\))\+`,
            outputRegex: "$1",
            outputNegativeRegex: "$1",
            outputNegativeRawRegex: "$1",
            recursiveCheck: false
        },
    ],
    auto1111RegexPatterns: [
        {
            inputRegex: String.raw`\[([^\]]+)\]`,
            outputRegex: "",
            outputNegativeRegex: "",
            outputNegativeRawRegex: "",
            recursiveCheck: false
        },
        {
            inputRegex: String.raw`withLora\((.*?),\s{0,3}([\d\.]+)\)`,
            outputRegex: "<lora:$1:$2>",
            outputNegativeRegex: "",
            outputNegativeRawRegex: "",
            recursiveCheck: false
        },
        {
            inputRegex: String.raw`\(([^\)]+)\)${defaultWeight}`,
            outputRegex: `[$1]`,
            outputNegativeRegex: "[$1]",
            outputNegativeRawRegex: "$1",
            recursiveCheck: false
        },
        {
            inputRegex: String.raw`\(([^\)]+)\)([\d\.]+)`,
            outputRegex: `$1:$2`,
            outputNegativeRegex: "$1:$2",
            outputNegativeRawRegex: "$1",
            recursiveCheck: false
        },
        {
            inputRegex: [String.raw`\(([^)]+)\)@`, String.raw`\(([^)]+)\)!`],
            outputRegex: "!#$1#!",
            outputNegativeRegex: "!#$1#!",
            outputNegativeRawRegex: "$1",
            recursiveCheck: true,
            replacementsMap:
            {
                loopCount: 10,
                replacements: [
                    { target: "@", replacement: String.raw`\+`, output: false },
                    { target: "!", replacement: String.raw`\-`, output: false },
                    { target: "!#", replacement: `(`, output: true },
                    { target: "#!", replacement: `)`, output: true },
                ]
            },
        },
    ]
};

var reverseConversion = false;
var allowReverseConversion = false;
var ignoreNegativeParameters = false;

function regexValueRecursiveReplace(input, regexPatternItem, forceRawRegex = false) {
    var inputPositive = input.positive;
    var inputNegative = input.negative;
    var replacementsMap = regexPatternItem.replacementsMap;
    var loopCount = replacementsMap.loopCount;
    var replacements = replacementsMap.replacements;
    var patternInput = regexPatternItem.inputRegex;
    var patternOutput = regexPatternItem.outputRegex;
    var patternNegativeOutput = regexPatternItem.outputNegativeRegex;
    var patternNegativeRawOutput = regexPatternItem.outputNegativeRawRegex;


    for (var i = loopCount; i >= 0; i--) {
        var iterations = i;
        patternInput = regexPatternItem.inputRegex;
        patternOutput = regexPatternItem.outputRegex;
        patternNegativeOutput = regexPatternItem.outputNegativeRegex;
        patternNegativeRawOutput = regexPatternItem.outputNegativeRawRegex;

        var inputRegexArray = [patternInput];
        if (typeof (patternInput) === 'object') {
            inputRegexArray = patternInput;
        }
        inputRegexArray.forEach(function (inputRegexItem) {

            replacements.forEach(function (replacementItem) {
                var mapTarget = replacementItem.target;
                var mapReplacement = replacementItem.replacement;
                var mapOutput = replacementItem.output;
                if (iterations > 0) {
                    for (var j = 0; j < iterations; j++) {
                        mapReplacement += replacementItem.replacement;
                    }
                }
                if (!mapOutput) {
                    inputRegexItem = inputRegexItem.replace(mapTarget, mapReplacement);
                } else {
                    patternOutput = patternOutput.replace(mapTarget, mapReplacement);
                    if (patternNegativeOutput.indexOf(mapTarget) !== -1) {
                        patternNegativeOutput = patternNegativeOutput.replace(mapTarget, mapReplacement);
                    }
                }
            });

            var regexExp = new RegExp(inputRegexItem, 'g');
            if (typeof patternOutput !== 'function') {
                inputPositive = inputPositive.replace(regexExp, patternOutput);
                if (!ignoreNegativeParameters && !forceRawRegex) {
                    inputNegative = inputNegative.replace(regexExp, patternNegativeOutput);
                }
            } else {
                const regexGroups = inputPositive.matchAll(inputRegexItem);
                inputPositive = patternOutput(inputPositive, regexGroups);

                const regexNegativeGroups = inputNegative.matchAll(inputRegexItem);
                if (!ignoreNegativeParameters && !forceRawRegex) {
                    inputNegative = patternOutput(inputNegative, regexNegativeGroups);
                }
            }
            if (ignoreNegativeParameters || forceRawRegex) {
                inputNegative = inputNegative.replace(regexExp, patternNegativeRawOutput);
            }
        });

    }
    var output = {
        positive: inputPositive,
        negative: inputNegative
    };
    return output;
}

function regexValueReplace(input, regexPatternItem, forceRawRegex = false) {
    var inputPositive = input.positive;
    var inputNegative = input.negative;
    var patternInput = regexPatternItem.inputRegex;
    var patternOutput = regexPatternItem.outputRegex;
    var patternNegativeOutput = regexPatternItem.outputNegativeRegex;
    var patternNegativeRawOutput = regexPatternItem.outputNegativeRawRegex;

    var inputRegexArray = [patternInput];
    if (typeof (patternInput) === 'object') {
        inputRegexArray = patternInput;
    }

    inputRegexArray.forEach(function (inputRegexItem) {
        var regexExp = new RegExp(inputRegexItem, 'g');
        if (typeof patternOutput !== 'function') {
            inputPositive = inputPositive.replace(regexExp, patternOutput);
            if (!ignoreNegativeParameters && !forceRawRegex) {
                inputNegative = inputNegative.replace(regexExp, patternNegativeOutput);
            }
        } else {
            const regexGroups = inputPositive.matchAll(inputRegexItem);
            inputPositive = patternOutput(inputPositive, regexGroups);
            if (!ignoreNegativeParameters && !forceRawRegex) {
                const regexNegativeGroups = inputNegative.matchAll(inputRegexItem);
                inputNegative = patternOutput(inputNegative, regexNegativeGroups);
            }
        }
        if (ignoreNegativeParameters || forceRawRegex) {
            inputNegative = inputNegative.replace(regexExp, patternNegativeRawOutput);
        }
    });


    var output = {
        positive: inputPositive,
        negative: inputNegative
    };
    return output;
}

function fetchInvokeAINegatives(inputText) {
    var negativeRegex = String.raw`\[([^\]]+)\]`;
    const regexGroups = inputText.matchAll(negativeRegex);
    var negativeElements = [];
    for (const match of regexGroups) {
        var fullMatch = match[0];
        var innerMatch = match[1];
        negativeElements.push(innerMatch);
    }
    return negativeElements.join(", ");
}
function resolvePromptSyntax() {
    var output = {
        positive: "",
        negative: ""
    };

    var targetConversionTable = null;
    if (!reverseConversion) {
        targetConversionTable = regexConversionTable.invokeAIRegexPatterns;
        output.positive = $('#auto1111-positive').val();
        output.negative = $('#auto1111-negative').val();
    } else {
        targetConversionTable = regexConversionTable.auto1111RegexPatterns;
        output.positive = $('#invokeai-prompt').val();
        output.negative = fetchInvokeAINegatives(output.positive);
    }

    targetConversionTable.forEach(regexPatternItem => {
        var patternRecursive = regexPatternItem.recursiveCheck;
        if (patternRecursive) {
            output = regexValueRecursiveReplace(output, regexPatternItem);
        } else {
            output = regexValueReplace(output, regexPatternItem);
        }
    });

    if (!reverseConversion) {
        var invokeAIOutput = output.positive.trim();
        if (output.negative.trim().length > 0) {
            invokeAIOutput += "\n\n" + "[" + output.negative.trim() + "]"
        }
        $('#invokeai-prompt').val(invokeAIOutput);
    } else {
        $('#auto1111-positive').val(output.positive.trim());
        $('#auto1111-negative').val(output.negative.trim());
    }
    calculateTokensCount();
}

function resolveTokensValues(inputValue, invokeAI = false) {
    var regexCleaner = regexConversionTable.invokeAIRegexPatterns
    if (invokeAI) {
        regexCleaner = regexConversionTable.auto1111RegexPatterns;
    }
    regexCleaner.forEach(regexPatternItem => {
        var output = {
            positive: "",
            negative: inputValue
        };
        var patternRecursive = regexPatternItem.recursiveCheck;
        if (patternRecursive) {
            output = regexValueRecursiveReplace(output, regexPatternItem, true);
        } else {
            output = regexValueReplace(output, regexPatternItem, true);
        }
        inputValue = output.negative;
    });
    return inputValue;
}

function calculateTokens(inputValue, counterElementID, invokeAI = false) {
    if (inputValue.length > 0) {
        if (inputValue.indexOf("#") === 0) {
            inputValue = $(inputValue).val();
        }
        var cleanedInput = resolveTokensValues(inputValue, invokeAI);
        const inputElementEncoded = encode(cleanedInput);
        $('#' + counterElementID).html(inputElementEncoded.length);
    } else {
        $('#' + counterElementID).html(0);
    }
}

function calculateTokensCount() {
    calculateTokens("#auto1111-positive", "auto1111-tokens-positive");
    calculateTokens("#auto1111-negative", "auto1111-tokens-negative");

    var invokeaiInput = $('#invokeai-prompt').val();
    var invokeaiPositive = invokeaiInput.replace(/\[([^\]]+)\]/g, "");
    var invokeaiNegative = fetchInvokeAINegatives(invokeaiInput);
    calculateTokens(invokeaiPositive, "invokeai-tokens-positive", true);
    calculateTokens(invokeaiNegative, "invokeai-tokens-negative", true);
}

$(document).ready(function () {
    $(".prompt-input").on("input", function () {
        reverseConversion = false;
        resolvePromptSyntax();
    });

    $(".prompt-input-reversed").on("input", function () {
        if (allowReverseConversion) {
            reverseConversion = true;
            resolvePromptSyntax();
        } else {
            calculateTokensCount()
        }
    });

    $('#reverse-check').prop('checked', allowReverseConversion);
    $('#raw-negative-check').prop('checked', ignoreNegativeParameters);

    $('#reverse-check').change(function () {
        allowReverseConversion = this.checked;
    });

    $('#raw-negative-check').change(function () {
        ignoreNegativeParameters = this.checked;
        reverseConversion = $('#reverse-check').is(':checked');
        resolvePromptSyntax();
    });

    $('#copy-auto1111-positive, .input-label[for=auto1111-positive]').click(function () {
        var thisElement = $("#copy-auto1111-positive");
        var inputValue = $('#auto1111-positive').val();
        navigator.clipboard.writeText(inputValue);
        $('.copy-text', thisElement).fadeIn("fast").css("display", "inline");
        setTimeout(function () {
            $('.copy-text', thisElement).fadeOut();
        }, 2500);
    });

    $('#copy-auto1111-negative, .input-label[for=auto1111-negative]').click(function () {
        var thisElement = $("#copy-auto1111-negative");
        var inputValue = $('#auto1111-negative').val();
        navigator.clipboard.writeText(inputValue);
        $('.copy-text', thisElement).fadeIn("fast").css("display", "inline");
        setTimeout(function () {
            $('.copy-text', thisElement).fadeOut();
        }, 2500);
    });

    $('#copy-invokeai-prompt, .input-label-invoke').click(function () {
        var thisElement = $("#copy-invokeai-prompt");
        var inputValue = $('#invokeai-prompt').val();
        navigator.clipboard.writeText(inputValue);
        $('.copy-text-invokeai', thisElement).fadeIn(10).css("display", "inline");
        setTimeout(function () {
            $('.copy-text-invokeai', thisElement).fadeOut();
        }, 2500);
    });

    setTimeout(resolvePromptSyntax(), 500);
});
