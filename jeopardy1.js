// categories is the main data structure for the app; it looks like this:

//  [
//    { title: "Math",
//      clues: [
//        {question: "2+2", answer: 4, showing: null},
//        {question: "1+1", answer: 2, showing: null}
//        ...
//      ],
//    },
//    { title: "Literature",
//      clues: [
//        {question: "Hamlet Author", answer: "Shakespeare", showing: null},
//        {question: "Bell Jar Author", answer: "Plath", showing: null},
//        ...
//      ],
//    },
//    ...
//  ]

let categories = [];
const BASEURL = 'https://jservice.io/';
const NUM_CATEGORIES = 6;
let clueBank;

/** Get NUM_CATEGORIES random category from API.
 *
 * Returns array of category ids
 */

async function getCategoryIds() {
	const dupeChecker = new Set();
	while (dupeChecker.size < NUM_CATEGORIES) {
		const myCategories = await axios.get(
			BASEURL +
				`api/categories?count=1&offset=${Math.floor(Math.random() * 18000)}`
		);
		dupeChecker.add(myCategories.data[0].id);
	}
	return Array.from(dupeChecker);
}

/** Return object with data about a category:
 *
 *  Returns { title: "Math", clues: clue-array }
 *
 * Where clue-array is:
 *   [
 *      {question: "Hamlet Author", answer: "Shakespeare", showing: null},
 *      {question: "Bell Jar Author", answer: "Plath", showing: null},
 *      ...
 *   ]
 */

async function getCategory(catId) {
	const myCategory = await axios.get(BASEURL + `api/category?id=${catId}`);
	let { title, clues } = myCategory.data;
	clues = clues.map((val, i, arr) => {
		return {
			question: val.question,
			answer: val.answer,
			showing: val.showing,
		};
	});
	return { title, clues };
}

/** Fill the HTML table#jeopardy with the categories & cells for questions.
 *
 * - The <thead> should be filled w/a <tr>, and a <td> for each category
 * - The <tbody> should be filled w/NUM_QUESTIONS_PER_CAT <tr>s,
 *   each with a question for each category in a <td>
 *   (initally, just show a "?" where the question/answer would go.)
 */

function fillTable(categoryObjects) {
	const myTable = document.createElement('table');
	myTable.classList.toggle('table');
	//myTable.classList.toggle('table-responsive');
	const tableHead = document.createElement('thead');
	const tableHeadRow = addRow(tableHead);

	categoryObjects.forEach((val, i, arr) => {
		const { title } = val;
		const myDataBox = addData(
			tableHeadRow,
			title,
			'bg-dark-cust',
			'text-center',
			'text-uppercase',
			'text-white',
			'align-middle',
			'text-wrap'
		);
		myDataBox.innerHTML = `<h3>${title}</h3>`;
	});

	const tableBody = document.createElement('tbody');
	console.log(categoryObjects);
	for (let i = 0; i < 5; i++) {
		const tableBodyRow = addRow(tableBody);
		for (let q = 0; q < categoryObjects.length; q++) {
			const myDataBox = addData(
				tableBodyRow,
				'questionBox',
				'bg-light-cust',
				'text-center',
				'align-middle',
				'no-show'
			);
			myDataBox.setAttribute('id', categoryObjects[q].clues[i].id);
			myDataBox.innerText = `${(i + 1) * 100}`;
		}
	}

	myTable.append(tableHead, tableBody);
	$('.game').append(myTable);
}

function addRow(element, ...classes) {
	const myRow = document.createElement('tr');
	for (let myClass in classes) {
		const className = myClass.replace(/\s/g, '');
		myRow.classList.toggle(className);
	}
	element.append(myRow);
	return myRow;
}

function addData(element, ...classes) {
	const myData = document.createElement('td');
	for (let myClass of classes) {
		const className = myClass.replace(/\s/g, '');
		myData.classList.toggle(className);
	}
	element.append(myData);
	return myData;
}

/** Handle clicking on a clue: show the question or answer.
 *
 * Uses .showing property on clue to determine what to show:
 * - if currently null, show question & set .showing to "question"
 * - if currently "question", show answer & set .showing to "answer"
 * - if currently "answer", ignore click
 * */

function handleClick() {
	const question = clueBank[$(this).attr('id')];
	console.log(question);
	switch (question.showing) {
		case undefined:
			question.showing = 'question';
			console.log($(`${question.id}`));
			$(`#${question.id}`).html(`${question.question}`);
			$(this).toggleClass('no-show');
			$(this).toggleClass('show-q');
			break;
		case 'question':
			question.showing = 'answer';
			$(`#${question.id}`).html(`${question.answer}`);
			$(this).toggleClass('show-q');
			$(this).toggleClass('show-a');
			$(this).toggleClass('text-capitalize');
			break;
		case 'answer':
			break;
	}
}

/** Wipe the current Jeopardy board, show the loading spinner,
 * and update the button used to fetch data.
 */

function showLoadingView() {
	$('.game').html('');
	$('.start').html(
		'<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...'
	);
	$('.game').append(
		'<div class = "container-fluid text-center"><div class="sk-chase"><div class="sk-chase-dot"></div><div class="sk-chase-dot"></div><div class="sk-chase-dot"></div><div class="sk-chase-dot"></div><div class="sk-chase-dot"></div><div class="sk-chase-dot"></div></div></div>'
	);
}

/** Remove the loading spinner and update the button used to fetch data. */

function hideLoadingView() {
	$('.game').html('');
	$('.start').html('Restart');
}

/** Start game:
 *
 * - get random category Ids
 * - get data for each category
 * - create HTML table
 * */

async function setupAndStart() {
	showLoadingView();
	const myCategoryIds = await getCategoryIds();
	const myCategories = [];

	for (let id of myCategoryIds) {
		myCategories.push(await getCategory(id));
	}
	randomizeClues(myCategories);
	clueBank = makeClueBank(myCategories);
	hideLoadingView();
	fillTable(myCategories);
	$('table').on('click', 'td.questionBox', handleClick);
	console.log(clueBank);
}

function makeClueBank(allCategoryObjects) {
	let id = 0;
	const returnClueBank = [];
	for (let i = 0; i < 5; i++) {
		for (let q = 0; q < allCategoryObjects.length; q++) {
			allCategoryObjects[q].clues[i].id = id;
			returnClueBank.push(allCategoryObjects[q].clues[i]);
			id++;
		}
	}
	return returnClueBank;
}

function randomizeClues(allCategoryObjects) {
	for (let category of allCategoryObjects) {
		if (category.clues.length > 5) {
			const newClueList = [];
			const questionsPicked = new Set();
			while (questionsPicked.size < 5) {
				const numberToAdd = Math.floor(Math.random() * category.clues.length);
				console.log(category.clues[numberToAdd].question);
				if (
					category.clues[numberToAdd].question == '' ||
					category.clues[numberToAdd].answer == ''
				) {
					continue;
				} else {
					questionsPicked.add(numberToAdd);
				}
			}
			for (let index of Array.from(questionsPicked)) {
				newClueList.push(category.clues[index]);
			}
			category.clues = newClueList;
		}
	}
}

/** On click of start / restart button, set up game. */

$('.start').on('click', setupAndStart);