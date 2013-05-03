//write method to test whether answer is correct
//write tests
//display questions and results using Dust.js, passing collections
//move modules into separate files and load with require.js
//authorize user and save results using Node.js and either mongo or couchbase
//allow each module to have it's own css styling for questions and results without embedding styles into html through templates

var mathPractice = (function ($) {

    var module;
    var startTime;

    function Rational(numerator, denominator) {
        this.numerator = numerator;
        if (arguments.length > 1) {
            if (denominator === 0) {
                throw new Error('Denominator may not be zero.');
            }
            this.denominator = denominator;
        } else {
            this.denominator = 1;
        }
    }
    Rational.prototype.integer = function () {
        return Math.floor(this.numerator / this.denominator);
    };
    Rational.prototype.remainder = function () {
        return this.numerator % this.denominator;
    };

    function Expression(operator) {
        this.operator = operator;
        this.operands = [];
        for (var i = 1, len = arguments.length; i < len; i++) {
            this.operands.push(arguments[i]);
        }
    }
    Expression.prototype.evaluate = function () {
        switch (this.operator) {
            case '+':
                var sum = this.operands[0] + this.operands[1];
                return new Rational(sum);
            case '-':
                var difference = this.operands[0] - this.operands[1];
                return new Rational(difference);
            case '*':
                var product = this.operands[0] * this.operands[1];
                return new Rational(product);
            case '/':
                return new Rational(this.operands[0], this.operands[1]);
            default:
                throw new Error('Unknown operator in evaluate method.');
        }
    };


    function extractConfigurationOptions() {
        var configurationOptions = {};
        $.each($('#configForm').serializeArray(), function (i, field) {
            configurationOptions[field.name] = field.value;
        });
        return configurationOptions;
    }

    function extractAnswerElements(id) {
        var answer = {};
        $('#' + id).find('input, select, radio').each(function () {
            answer[this.name] = +($(this).val());
        });
        return answer;
    }

    function makeModule(moduleName) {
        var module = {};
        module.name = moduleName;
        module.configTemplate = 'configTemplate';
        module.configurableOptions = {};
        module.questionTemplate = _.template($('#questionTemplate').html());

        switch (moduleName) {
            case 'Addition':
                module.configurableOptions.title = 'Addition';
                module.operator = '+';
                module.operatorDisplay = '+';
                module.configurableOptions.firstOperatorChoice = 'Always Start With';
                break;
            case 'Subtraction':
                module.configurableOptions.title = 'Subtraction';
                module.operator = '-';
                module.operatorDisplay = '-';
                module.configurableOptions.firstOperatorChoice = 'Always Start With';
                break;
            case 'Multiplication':
                module.configurableOptions.title = 'Multiplication';
                module.operator = '*';
                module.operatorDisplay = '&times;';
                module.configurableOptions.firstOperatorChoice = 'Times Table';
                break;
            case 'Division':
                module.configurableOptions.title = 'Division';
                module.operator = '/';
                module.operatorDisplay = '&divide;';
                module.configurableOptions.firstOperatorChoice = 'Divisor';
                break;
        }

        module.Question = function (id, configurationOptions) {

            this.id = id;

            var fixedOperand = parseInt(configurationOptions.alwaysStartWith,10);
            var digits = parseInt(configurationOptions.numDigits, 10);

            this.withRemainder = false;
            if (configurationOptions.withRemainder) {
                this.withRemainder = true;
            }

            var max = Math.pow(10, digits);

            var operand1, operand2;

            if (module.name === 'Division') {

                if (!isNaN(fixedOperand)) {
                    operand2 = fixedOperand;
                } else {
                    operand2 = Math.floor((Math.random() * max));
                }

                if (operand2 === 0) {
                    ++operand2;
                }

                var quo = Math.floor((Math.random() * max));
                if (quo === 0) {
                    ++quo;
                }
                operand1 = operand2 * quo;
                if (this.withRemainder) {
                    operand1 += Math.floor(Math.random() * operand2);
                }
            } else {
                if (!isNaN(fixedOperand)) {
                    operand1 = fixedOperand;
                } else {
                    operand1 = Math.floor((Math.random() * max));
                }

                if (module.name === 'Subtraction') {
                    operand2 = Math.floor((Math.random() * operand1));
                } else {
                    operand2 = Math.floor((Math.random() * max));
                }
            }

            this.expression = new Expression(module.operator, operand1, operand2);

            //remove this, question collection will be sent to template within createQuestions method
            this.html = module.questionTemplate({
                'operand1': operand1,
                    'operand2': operand2,
                    'operator': module.operatorDisplay,
                    'id': this.id,
                    'withRemainder': this.withRemainder
            });

            module.questions.push(this);
        };
        module.Question.prototype.systemAnswerComponents = function () {
            var answer = {};
            answer.integer = this.expression.evaluate().integer();
            if (this.withRemainder) {
                answer.remainder = this.expression.evaluate().remainder();
            }
            return answer;
        };

        return module;
    }

    function render(workflowState) {
        switch (workflowState) {
            case 'configure':
                $('#results').slideUp();
                $('#questionBlock').slideUp();
                $('#intro').slideUp();
                $('#config').slideDown();
                break;
            case 'practice':
                $('#checkWork').show();
                $('#cancel').show();
                $('#config').slideUp();
                $('#questionBlock').slideDown();
                break;
            case 'viewResults':
                $('#checkWork').hide();
                $('#cancel').hide();
                $('#results').slideDown();
                break;
            case 'intro':
                $('#results').hide();
                $('#questionBlock').hide();
                $('#config').hide();
                $('#intro').show();
        }
    }

    function setupConfigure() {
        var configTemplate = _.template($('#' + module.configTemplate).html());
        $('#configQuestions').html(configTemplate(module.configurableOptions));
    }

    function produceResults(numRight, numQuestions) {
        var resultsTemplate = _.template($('#resultsTemplate').html());
        var percent = (numRight / numQuestions * 100).toFixed(2);
        var endTime = new Date();
        var totalSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
        var minutes = Math.floor(totalSeconds / 60);
        var seconds = totalSeconds % 60;
        var resultsHTML = resultsTemplate({
            'numRight': numRight,
                'numQuestions': numQuestions,
                'percent': percent,
                'minutes': minutes,
                'seconds': seconds
        });
        $('#resultsText').html(resultsHTML);
    }

    return {

        createQuestions: function () {
            var configurationOptions = extractConfigurationOptions();
            module.questions = [];
            var numQuestions = configurationOptions.numQuestions;
            var el = $('#questions');
            el.html('');
            for (var i = 0; i < numQuestions; i++) {
                var question = new module.Question('question' + i, configurationOptions);
                el.append(question.html);
            }
            $('#sheetTitle').html(module.name);
            render('practice');
            startTime = new Date();
        },

        checkWork: function () {
            var numRight = 0;

            for (var i = 0; i < module.questions.length; i++) {
                var question = module.questions[i];

                var userAnswerComponents = extractAnswerElements(question.id);
                var answer = userAnswerComponents.integer;
                var remainder = userAnswerComponents.remainder || 0;

                var rightAnswer;
                var rightRemainder = 0;

                var systemAnswerComponents = question.systemAnswerComponents();
                rightAnswer = systemAnswerComponents.integer;
                rightRemainder = systemAnswerComponents.remainder || 0;

                //determine if correct by comparing systemAnswerComponents with userAnswerComponents	

                var answerElement = $($('#' + question.id + ' input')[0]);

                //fixes layout problem caused by question floating elements having various heights
                if(question.withRemainder)
                {
                    answerElement.parent().addClass('divisionResult');	
                }

                //remove this, put data into a collection and send to a template                
                if (answer === rightAnswer && remainder === rightRemainder) {
                    numRight++;
                    answerElement.parent().addClass('text-success');
                } else {
                    answerElement.parent().addClass('text-error');
                    if (question.withRemainder) {                        
                        if (answer !== rightAnswer) {
                            answerElement.css('text-decoration', 'line-through');
                            answerElement.after('<br>' + rightAnswer);
                        }
                        if (remainder !== rightRemainder) {
                            var remainderElement = $('#' + question.id + ' input[name="remainder"]')
                            remainderElement.css('text-decoration', 'line-through');
                            remainderElement.after('<br>' + rightRemainder);
                        }
                    } else {
                        answerElement.css('text-decoration', 'line-through');
                        answerElement.after('<br>' + rightAnswer);
                    }
                }
            }
            produceResults(numRight, module.questions.length);
            render('viewResults');
        },
        startAgain: function () {
            render('configure');
        },
        configure: function (moduleName) {
            module = makeModule(moduleName);
            setupConfigure();
            render('configure');
        },
        showIntro: function () {
            render('intro');
        }
    };
}(jQuery));

$(function () {
    $('#home').click(mathPractice.showIntro);
    $('.addition').click(function () {
        mathPractice.configure('Addition');
    });
    $('.subtraction').click(function () {
        mathPractice.configure('Subtraction');
    });
    $('.multiplication').click(function () {
        mathPractice.configure('Multiplication');
    });
    $('.division').click(function () {
        mathPractice.configure('Division');
    });
    $('#createPracticeSheet').click(mathPractice.createQuestions);
    $('#checkWork').click(mathPractice.checkWork);
    $('#cancel').click(mathPractice.startAgain);
    $('#practiceAgain').click(mathPractice.startAgain);
});