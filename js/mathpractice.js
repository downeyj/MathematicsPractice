
var mathPractice = (function($) {

	var operator='+';
	var questions=[];
	var startTime;

	function render(state)
	{
		switch(state)
		{
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

	function setupConfigure()
	{
		var configTemplate= _.template($('#configTemplate').html());
		var type;
		switch(operator)
		{
			case '+':
				type='Addition';
				firstOperatorChoice='Always Start With'
				break;
			case '-':
				type='Subtraction';
				firstOperatorChoice='Always Start With'
				break;
			case '&times;':
				type='Multiplication';
				firstOperatorChoice='Times Table'
				break;
			case '&divide;':
				type='Division';	
				firstOperatorChoice='Divisor'					
				break;
		}
		$('#configQuestions').html(configTemplate({"type": type,"firstOperatorChoice": firstOperatorChoice}))
	}

	function Question(id, digits, fixedOperand) {
		this.id=id;
		var max = Math.pow(10, digits);	

		if(operator==='&divide;')
		{
			if(fixedOperand)
			{
				this.operand2=fixedOperand;
			}
			else
			{			
				this.operand2=Math.floor((Math.random()*max));	
			}			
			var quo = Math.floor((Math.random()*max));
			if(this.operand2==0) { ++this.operand2; }
			if(quo==0) { ++quo; }
			this.operand1 = this.operand2 * quo;
		}
		else
		{
			if(fixedOperand)
			{
				this.operand1=fixedOperand;
			}
			else
			{			
				this.operand1=Math.floor((Math.random()*max));	
			}		

			if(operator==='-')
			{
				this.operand2=Math.floor((Math.random()*this.operand1));
			}		
			else
			{
				this.operand2=Math.floor((Math.random()*max));
			}
		}

		var questionTemplate= _.template($('#questionTemplate').html());
		this.html = questionTemplate({
			'operand1': this.operand1,
			'operand2': this.operand2,
			'operator': operator,
			'id': this.id
		});
		questions.push(this);	
	}

	function produceResults(numRight,numQuestions)
	{
		var resultsTemplate = _.template($('#resultsTemplate').html());
		var percent = (numRight/numQuestions * 100).toFixed(2);		
		var endTime = new Date();
		var totalSeconds = Math.floor((endTime.getTime() - startTime.getTime())/1000);
		var minutes = Math.floor(totalSeconds/60);
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
		createQuestions: function() {
			var fixedOperand = parseInt($('#alwaysStartWith').val()) || null;
			var numQuestions=parseInt($("#numQuestions").val()) || 10;
			var digits=parseInt($("#numDigits").val()) || 1;
			var el = $('#questions');
			el.html('');
			questions=[];
			for(var i = 0; i < numQuestions; i++)
			{
				var question = new Question('question' + i,digits,fixedOperand);
				el.append(question.html);
			}
			switch(operator)
			{
					case '+':
						$('#sheetTitle').html('Addition Practice');
						break;
					case '-':
						$('#sheetTitle').html('Subtraction Practice');
						break;
					case '&times;':
						$('#sheetTitle').html('Multiplication Practice');
						break;
					case '&divide;':
						$('#sheetTitle').html('Division Practice');						
						break;
			}
			render('practice');
			startTime = new Date();			
		},
		checkWork: function() { 
			var numRight=0;
			for(var i=0;i<questions.length;i++)
			{
				var question=questions[i];
				var answerElement=$('#' + question.id);
				var answer=parseInt(answerElement.val());
				switch(operator)
				{
					case '+':
						var rightAnswer=question.operand1 + question.operand2;						
						break;
					case '-':
						var rightAnswer=question.operand1 - question.operand2;						
						break;
					case '&times;':
						var rightAnswer=question.operand1 * question.operand2;						
						break;		
					case '&divide;':
						var rightAnswer=question.operand1 / question.operand2;						
						break;			
				}
				if(answer === rightAnswer)
				{
					numRight++;
					answerElement.parent().addClass('text-success');
				}
				else
				{
					answerElement.parent().addClass('text-error');
					answerElement.css('text-decoration','line-through');
					answerElement.after('<br>' + rightAnswer);						
				}
			}			
			produceResults(numRight,questions.length);
			render('viewResults');
		},
		startAgain: function() {
			render('configure');
		},
		cancel: function() {
			render('configure');
		},
		configure: function(op) {
			operator=op;
			setupConfigure();
			render('configure');
		},
		showIntro: function() {
			render('intro');
		}
	};
}(jQuery));


$(function() {
	$('#createPracticeSheet').click(mathPractice.createQuestions);
	$('#cancel').click(mathPractice.cancel);
	$('#checkWork').click(mathPractice.checkWork);
	$('#practiceAgain').click(mathPractice.startAgain);
	$('.addition').click(function() {
		mathPractice.configure('+');
	});
	$('.subtraction').click(function() {
		mathPractice.configure('-');
	});
	$('.multiplication').click(function() {
		mathPractice.configure('&times;');
	});
	$('.division').click(function() {
		mathPractice.configure('&divide;');
	});
	$('#home').click(mathPractice.showIntro);
});

