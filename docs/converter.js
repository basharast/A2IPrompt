/**
 * Developer: Bashar Astifan 2023
 * Link: https://github.com/basharast
 */


var reverseConversion = false;
var allowReverseConversion = false;
var ignoreNegativeParameters = true;

function resolvePromptSyntax() {
    var inputPositive = "";
    var inputNegative = "";

    var finalOutput = null;
    if (!reverseConversion) {
        inputPositive = $('#auto1111-positive').val();
        inputNegative = $('#auto1111-negative').val();
        finalOutput = convertAuto1111ToInvokeAI(inputPositive, inputNegative, ignoreNegativeParameters);
    } else {
        inputPositive = $('#invokeai-prompt').val();
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
        $('#invokeai-prompt').val(invokeAIOutput);
    } else {
        $('#auto1111-positive').val(auto1111.positive.text.trim());
        $('#auto1111-negative').val(auto1111.negative.text.trim());
    }
    calculateTokensCount(invokeai, auto1111);
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
    $(".prompt-input").on("input", function () {
        reverseConversion = false;
        resolvePromptSyntax();
    });

    $(".prompt-input-reversed").on("input", function () {
        if (allowReverseConversion) {
            reverseConversion = true;
            resolvePromptSyntax();
        } else {
            //Just calculate tokens
            var invokeAIInput = $('#invokeai-prompt').val();
            var tokensOutput = calculateInvokeAITokens(invokeAIInput);
            $('#invokeai-tokens-positive').html(tokensOutput.positive.tokens);
            $('#invokeai-tokens-negative').html(tokensOutput.negative.tokens);
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
