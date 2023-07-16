/**
 * Developer: Bashar Astifan 2023
 * Link: https://github.com/basharast
 */


var reverseConversion = false;
var allowReverseConversion = false;
var ignoreNegativeParameters = false;
var autoCopyInvokeAI = false;
var limitWeight = true;
var defaultLimitWeightPositive = "1.1";
var defaultLimitWeightNegative = "1.1";

var normalConversionInProgress = false;
var reverseConversionInProgress = false;

var auto1111PositiveCodeMirror = null;
var auto1111NegativeCodeMirror = null;
var invokeaiCodeMirror = null;

function resolvePromptSyntax() {
    var inputPositive = "";
    var inputNegative = "";

    var finalOutput = null;
    if (!reverseConversion) {
        inputPositive = auto1111PositiveCodeMirror.getValue();
        inputNegative = auto1111NegativeCodeMirror.getValue();
        finalOutput = convertAuto1111ToInvokeAI(inputPositive, inputNegative, ignoreNegativeParameters);
    } else {
        inputPositive = invokeaiCodeMirror.getValue();
        finalOutput = convertInvokeAIToAuto1111(inputPositive, inputNegative, ignoreNegativeParameters);
    }

    var invokeai = finalOutput.to;
    var auto1111 = finalOutput.from;
    if (reverseConversion) {
        invokeai = finalOutput.from;
        auto1111 = finalOutput.to;
    }

    if (!reverseConversion) {
        var invokeAIOutput = invokeai.positive.text.trim();
        if (invokeai.negative.text.trim().length > 0) {
            invokeAIOutput += "\n\n" + "[" + invokeai.negative.text.trim() + "]"
        }
        invokeaiCodeMirror.getDoc().setValue(invokeAIOutput);
        setTimeout(function () {
            normalConversionInProgress = false;
        }, 100);
    } else {
        auto1111PositiveCodeMirror.getDoc().setValue(auto1111.positive.text.trim());
        auto1111NegativeCodeMirror.getDoc().setValue(auto1111.negative.text.trim());
        setTimeout(function () {
            reverseConversionInProgress = false;
        }, 100);
    }
    calculateTokensCount(invokeai, auto1111);
    if (autoCopyInvokeAI) {
        $("#copy-invokeai-prompt").click();
    }
}

function calculateTokensCount(invokeai, auto1111) {
    //Update tokens counters
    $('#invokeai-tokens-positive').html(invokeai.positive.tokens);
    $('#invokeai-tokens-negative').html(invokeai.negative.tokens);
    $('#auto1111-tokens-positive').html(auto1111.positive.tokens);
    $('#auto1111-tokens-negative').html(auto1111.negative.tokens);
}

//Page events
$(document).ready(function () {

    //CodeMirror default config
    var mirrorConfigs = {
        matchBrackets: true,
        lineWrapping: true,
        placeholder: "",
        mode: "prompt",
        theme: "night",
        stylesheet: "assets/prompt.css",
        parserfile: "assets/prompt.js",
        scrollbarStyle: "simple"
    };

    //CodeMirror InvokeAI
    var invokeaiElement = $('#invokeai-prompt');
    var invokeConfigs = mirrorConfigs;
    invokeConfigs.placeholder = invokeaiElement.attr("placeholder");
    invokeConfigs.mode = "prompt-invokeai";
    invokeaiCodeMirror = CodeMirror.fromTextArea(invokeaiElement.get(0), invokeConfigs);
    invokeaiCodeMirror.on("change", function (cm, change) {
        if (!normalConversionInProgress) {
            if (allowReverseConversion) {
                reverseConversion = true;
                reverseConversionInProgress = true;
                resolvePromptSyntax();
            } else {
                //Just calculate tokens
                var invokeAIInput = cm.getValue();
                var tokensOutput = calculateInvokeAITokens(invokeAIInput);
                $('#invokeai-tokens-positive').html(tokensOutput.positive.tokens);
                $('#invokeai-tokens-negative').html(tokensOutput.negative.tokens);
            }
        }
    });


    //CodeMirror Auto1111 Positive
    var auto111PositiveElement = $('#auto1111-positive');
    var auto111PositiveConfigs = mirrorConfigs;
    auto111PositiveConfigs.placeholder = auto111PositiveElement.attr("placeholder");
    auto111PositiveConfigs.mode = "prompt-positive";
    auto1111PositiveCodeMirror = CodeMirror.fromTextArea(auto111PositiveElement.get(0), auto111PositiveConfigs);
    auto1111PositiveCodeMirror.on("change", function (cm, change) {
        if (!reverseConversionInProgress) {
            reverseConversion = false;
            normalConversionInProgress = true;
            resolvePromptSyntax();
        }
    });

    //CodeMirror Auto1111 Positive
    var auto111NegativeElement = $('#auto1111-negative');
    var auto111NegativeConfigs = mirrorConfigs;
    auto111NegativeConfigs.placeholder = auto111NegativeElement.attr("placeholder");
    auto111NegativeConfigs.mode = "prompt-negative";
    auto1111NegativeCodeMirror = CodeMirror.fromTextArea(auto111NegativeElement.get(0), auto111NegativeConfigs);
    auto1111NegativeCodeMirror.on("change", function (cm, change) {
        if (!reverseConversionInProgress) {
            reverseConversion = false;
            normalConversionInProgress = true;
            resolvePromptSyntax();
        }
    });


    //Set default options
    $('#reverse-check').prop('checked', allowReverseConversion);
    $('#raw-negative-check').prop('checked', ignoreNegativeParameters);
    $('#limit-weight-check').prop('checked', limitWeight);
    $('#auto-copy-check').prop('checked', autoCopyInvokeAI);
    $('#limit-weight-positive-value').val(defaultLimitWeightPositive);
    $('#limit-weight-negative-value').val(defaultLimitWeightNegative);


    //Attach checkboxes events
    $(".limit-weight").on("input", function () {
        defaultLimitWeightPositive = $('#limit-weight-positive-value').val();
        defaultLimitWeightNegative = $('#limit-weight-negative-value').val();
        setLimitedWeight(defaultLimitWeightPositive, defaultLimitWeightNegative);
        resolvePromptSyntax();
    });

    if (limitWeight) {
        $('.limit-weight').prop('disabled', false);
        setLimitedWeight(defaultLimitWeightPositive, defaultLimitWeightNegative);
        if (ignoreNegativeParameters) {
            $('#limit-weight-negative-value').prop('disabled', true);
        } else {
            $('#limit-weight-negative-value').prop('disabled', false);
        }
    } else {
        $('.limit-weight').prop('disabled', true);
    }

    $('#reverse-check').change(function () {
        allowReverseConversion = this.checked;
    });

    $('#auto-copy-check').change(function () {
        autoCopyInvokeAI = this.checked;
    });

    $('#raw-negative-check').change(function () {
        ignoreNegativeParameters = this.checked;
        if (ignoreNegativeParameters) {
            $('#limit-weight-negative-value').prop('disabled', true);
        } else {
            $('#limit-weight-negative-value').prop('disabled', false);
        }
        reverseConversion = $('#reverse-check').is(':checked');
        resolvePromptSyntax();
    });

    $('#limit-weight-check').change(function () {
        limitWeight = this.checked;
        if (limitWeight) {
            $('.limit-weight').prop('disabled', false);
            setLimitedWeight(defaultLimitWeightPositive, defaultLimitWeightNegative);
            if (ignoreNegativeParameters) {
                $('#limit-weight-negative-value').prop('disabled', true);
            } else {
                $('#limit-weight-negative-value').prop('disabled', false);
            }
        } else {
            $('.limit-weight').prop('disabled', true);
            setLimitedWeight("$1", "$1");
        }
        reverseConversion = $('#reverse-check').is(':checked');
        resolvePromptSyntax();
    });

    //Attach copy events
    $('#copy-auto1111-positive, .input-label[target=auto1111-positive]').click(function () {
        var thisElement = $("#copy-auto1111-positive");
        var inputValue = auto1111PositiveCodeMirror.getValue();
        navigator.clipboard.writeText(inputValue);
        $('.copy-text', thisElement).fadeIn("fast").css("display", "inline");
        setTimeout(function () {
            $('.copy-text', thisElement).fadeOut();
        }, 2500);
    });

    $('#copy-auto1111-negative, .input-label[target=auto1111-negative]').click(function () {
        var thisElement = $("#copy-auto1111-negative");
        var inputValue = auto1111NegativeCodeMirror.getValue();
        navigator.clipboard.writeText(inputValue);
        $('.copy-text', thisElement).fadeIn("fast").css("display", "inline");
        setTimeout(function () {
            $('.copy-text', thisElement).fadeOut();
        }, 2500);
    });

    var totalClipboardCalls = 0;
    $('#copy-invokeai-prompt, .input-label-invoke').click(function () {
        var thisElement = $("#copy-invokeai-prompt");
        var inputValue = invokeaiCodeMirror.getValue();
        try {
            totalClipboardCalls++;
            setTimeout(function () {
                if (totalClipboardCalls == 1) {
                    navigator.clipboard.writeText(inputValue);
                    $('.copy-text-invokeai', thisElement).fadeIn("fast").css("display", "inline");
                    setTimeout(function () {
                        $('.copy-text-invokeai', thisElement).fadeOut();
                    }, 2500);
                }
                totalClipboardCalls--;
            }, autoCopyInvokeAI ? 1000 : 1);

        } catch (e) {
            console.warn(e);
        }
    });

    //Call resolve after page load
    setTimeout(resolvePromptSyntax(), 500);

    //Attach tooltips
    tippy('[data-tippy-content]');

    //Scroll event
    $(window).bind('scroll', function () {
        if ($(window).scrollTop() + $(window).height() == $(document).height()) {
            //Prevent copyright section from blocking options on small screens
            if (!$("#page-footer").is(":hidden")) {
                $("#page-footer").fadeOut("fast");
            }
        } else {
            if ($("#page-footer").is(":hidden")) {
                $("#page-footer").fadeIn("fast");
            }
        }
    });
});
