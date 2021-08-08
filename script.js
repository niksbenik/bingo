function getLocalItem(itemName)
{
	const item = window.localStorage.getItem(itemName);
	if (item === null)
		return "";
	return item;
}

function setLocalItem(itemName, itemValue)
{
	window.localStorage.setItem(itemName, itemValue);
}

function populateActivityList()
{
	let activities = getLocalItem("Activities");
	if (activities == "") {
		activities = '["Watch your favourite movie","Listen to good music","Puzzle","Play a fun game","Drink beer","Take a walk","Ride your bike","Eat pancakes"]';
		setLocalItem("Activities", activities);
	}
	activities = JSON.parse(activities);
	let activityList = document.getElementById("ActivityList");
	activityList.innerHTML = "";
	for (i = 0; i < activities.length; ++i) {
		let node = document.createElement("li");
		let removeButton = document.createElement("input");
		removeButton.setAttribute("class", "removeButton");
		removeButton.setAttribute("type", "button");
		removeButton.onclick = function ()
		{
			removeActivity(node.lastChild.value);
			populateActivityList();
		};
		node.appendChild(removeButton);
		let textNode = document.createTextNode(activities[i]);
		node.appendChild(textNode);
		activityList.appendChild(node);
		node.onmouseenter = function ()
		{
			let textNode = node.lastChild;
			let edit = document.createElement("input");
			edit.setAttribute("type", "text");
			edit.autofocus = true;
			edit.defaultValue = textNode.nodeValue;
			node.replaceChild(edit, textNode);
		};
		node.onmouseleave = function ()
		{
			const edit = node.lastChild;
			const activity = edit.value;
			let textNode = document.createTextNode(activity);
			if (edit.defaultValue != activity)
				replaceActivity(edit.defaultValue, activity);
			node.replaceChild(textNode, edit);
		};
	}
}

function markForBingo(checkedCells)
{
	let table = document.getElementById("BingoTableBody");
	const n = table.rows.length;
	for (let r = 0; r < n; ++r)
		for (let c = 0; c < n; ++c)
			if (checkedCells.find(element => element[0] == r && element[1] == c))
				table.rows[r].cells[c].setAttribute("class", "bingoWin");
}

function updateBingoState()
{
	let table = document.getElementById("BingoTableBody");
	const n = table.rows.length;
	let checkedCells = [];
	let leftDiagonalChecked = true;
	for (let r = 0; r < n; ++r) {
		let rowChecked = true;
		for (let c = 0; c < n; ++c) {
			let cell = table.rows[r].cells[c];
			const checked = cell.getAttribute("checked") == "true";
			cell.setAttribute("class", checked ? "blue" : "");
			rowChecked &= checked;
			if (r == c)
				leftDiagonalChecked &= checked;
		}
		if (rowChecked)
			for (let c = 0; c < n; ++c)
				checkedCells.push([r, c]);
	}
	let rightDiagonalChecked = true;
	for (let c = 0; c < n; ++c) {
		let colChecked = true;
		for (let r = 0; r < n; ++r) {
			let cell = table.rows[r].cells[c];
			const checked = cell.getAttribute("checked") == "true";
			cell.setAttribute("class", checked ? "blue" : "");
			colChecked &= checked;
			if (c + r == n - 1)
				rightDiagonalChecked &= checked;
		}
		if (colChecked)
			for (let r = 0; r < n; ++r)
				checkedCells.push([r, c]);
	}
	for (let r = 0; r < n; ++r)
		for (let c = 0; c < n; ++c)
			if ((leftDiagonalChecked && r == c) || (rightDiagonalChecked && r + c == n - 1))
				checkedCells.push([r, c]);

	markForBingo(checkedCells);

	document.getElementById("BingoMessage").style.display = checkedCells.length > 0 ? "block" : "none";
}

function populateBingoTable(overrideTable = false)
{
	let activities = getLocalItem("Activities");
	activities = JSON.parse(activities);

	let table = document.getElementById("BingoTableBody");
	while (table.rows.length)
		table.deleteRow(0);
	let spinbox = document.getElementById("Spinbox");
	let tableState = getLocalItem("TableState");
	if (tableState != "") {
		tableState = JSON.parse(tableState);
		if (!overrideTable)
			spinbox.value = tableState.length;
	}
	else
		tableState = [];
	if (overrideTable)
		tableState = [];
	const empty = tableState.length == 0;
	const n = spinbox.value;

	let activityIndices = [];
	for (let i = 0; i < n * n; ++i) {
		let index = -1;
		for (let repeat = true, iter = 0; repeat && iter < activities.length; ++iter) {
			repeat = false;
			index = Math.floor(Math.random() * activities.length);
			for (let j = 0; j < activityIndices.length; ++j)
				if (activityIndices[j] == index)
					repeat = true;
		}
		activityIndices[i] = index;
	}

	for (let r = 0; r < n; ++r) {
		if (empty)
			tableState[r] = [];
		let row = table.insertRow();
		for (let c = 0; c < n; ++c) {
			let cell = row.insertCell(c);
			const tableStateCellChecked = !empty ? tableState[r][c].checked : false;
			cell.setAttribute("checked", empty ? "false" : (tableStateCellChecked ? "true" : "false"));
			cell.setAttribute("class", empty ? "" : (tableStateCellChecked ? "blue" : ""));
			cell.onmouseenter = function ()
			{
				cell.style.cursor = "pointer";
			};
			cell.onclick = function ()
			{
				const cellChecked = cell.getAttribute("checked") != "true";
				cell.setAttribute("checked", cellChecked ? "true" : "false");

				let tableState = JSON.parse(getLocalItem("TableState"));
				for (let i = 0; i < n; ++i)
					for (let j = 0; j < n; ++j)
						if (tableState[i][j].activity == activity) {
							tableState[i][j].checked = cellChecked;
							table.rows[i].cells[j].setAttribute("checked", cellChecked ? "true" : "false");
						}
				setLocalItem("TableState", JSON.stringify(tableState));
				updateBingoState();
			};

			let cellDiv = document.createElement("div");
			const activity = empty ? activities[activityIndices[r * n + c]] : tableState[r][c].activity;
			cellDiv.appendChild(document.createTextNode(activity));
			cell.appendChild(cellDiv);
			if (empty)
				tableState[r][c] = {"checked": cell.getAttribute("checked") == "true", "activity": activity};
		}
	}
	setLocalItem("TableState", JSON.stringify(tableState));
}

function addNewActivity(activity)
{
	let activities = JSON.parse(getLocalItem("Activities"));
	let found = false;
	for (let i = 0; i < activities.length; ++i)
		if (activities[i] == activity) {
			found = true;
			break;
		}
	if (!found) {
		activities.push(activity);
		setLocalItem("Activities", JSON.stringify(activities));
	}
}

function replaceActivity(oldActivity, newActivity)
{
	let activities = JSON.parse(getLocalItem("Activities"));
	for (let i = 0; i < activities.length; ++i)
		if (activities[i] == oldActivity) {
			activities[i] = newActivity;
			setLocalItem("Activities", JSON.stringify(activities));
			break;
		}
}

function removeActivity(activity)
{
	let activities = JSON.parse(getLocalItem("Activities"));
	for (let i = 0; i < activities.length; ++i)
		if (activities[i] == activity) {
			activities.splice(i, 1);
			setLocalItem("Activities", JSON.stringify(activities));
			break;
		}
}

const spinbox = document.getElementById("Spinbox");
spinbox.oninput = function () { populateBingoTable(true); };

var addActivityButton = document.getElementById("AddActivityButton");
addActivityButton.onclick = function ()
{
	let edit = document.createElement("input");
	edit.setAttribute("type", "text");
	edit.onkeyup = function (e)
	{
		if (e.key === 'Enter') {
			addNewActivity(edit.value);
			edit.parentNode.replaceChild(addActivityButton, edit);
			populateActivityList();
		}
		else if (e.key === 'Escape')
			edit.parentNode.replaceChild(addActivityButton, edit);
	};
	addActivityButton.parentNode.replaceChild(edit, addActivityButton);
	edit.focus();
};

var doItAgainButton = document.getElementById("DoItAgainButton");
doItAgainButton.onclick = function ()
{
	document.getElementById("BingoMessage").style.display = "none";
	populateBingoTable(true);
};

document.getElementById("RegenerateTableButton").onclick = function ()
{
	populateBingoTable(true);
	updateBingoState();
};

populateActivityList();
populateBingoTable();
updateBingoState();
