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
	let focused = false;
	const handleEditClose = function (node, save = false)
	{
		const edit = node.lastChild;
		if (edit.nodeName == "INPUT") {
			const activity = save ? edit.value : edit.getAttribute("original");
			let textNode = document.createTextNode(activity);
			if (edit.defaultValue != activity)
				replaceActivity(edit.defaultValue, activity);
			node.replaceChild(textNode, edit);
		}
	};
	for (i = 0; i < activities.length; ++i) {
		let node = document.createElement("li");
		let removeButton = document.createElement("input");
		removeButton.setAttribute("class", "removeButton");
		removeButton.setAttribute("type", "button");
		removeButton.style.padding = "0 1em 0";
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
			if (!focused) {
				let textNode = node.lastChild;
				let edit = document.createElement("input");
				edit.setAttribute("type", "text");
				edit.autofocus = true;
				edit.setAttribute("original", edit.defaultValue = textNode.nodeValue);
				edit.style.fontSize = node.style.fontSize;
				edit.onfocus = function ()
				{
					focused = true;
					edit.onkeyup = function (e)
					{
						if (e.key === 'Enter' || e.key === 'Escape') {
							focused = false;
							handleEditClose(node, e.key === 'Enter');
						}
					};
				};
				node.replaceChild(edit, textNode);
			}
		};
		node.onmouseleave = function ()
		{
			if (!focused)
				handleEditClose(node);
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
		let tried = new Set();
		for (let repeat = true; repeat;) {
			repeat = false;
			index = Math.floor(Math.random() * activities.length);
			tried.add(index);
			for (let j = 0; j < activityIndices.length; ++j)
				if (activityIndices[j] == index)
					repeat = true;
			if (repeat) {
				let triedAll = true;
				for (let j = 0; triedAll && j < activities.length; ++j)
					triedAll &= tried.has(j);
				if (triedAll)
					repeat = false;
			}
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
			cell.style.cursor = "pointer";
			cell.onmouseenter = function ()
			{
				cell.style.border = "solid white 1px";
			};
			cell.onmouseleave = function ()
			{
				cell.style.border = "solid black 1px";
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

var navbar = document.getElementById("navbar");
var sticky = navbar.offsetTop;

window.onscroll = function ()
{
	let navbar = document.getElementById("navbar");

	if (window.pageYOffset >= sticky)
		navbar.classList.add("sticky")
	else
		navbar.classList.remove("sticky");
};

const spinbox = document.getElementById("Spinbox");
spinbox.oninput = function () { populateBingoTable(true); };

var addActivityButton = document.getElementById("AddActivityButton");
addActivityButton.onclick = function ()
{
	let parentDiv = addActivityButton.parentNode;
	let edit = document.createElement("input");
	edit.setAttribute("type", "text");
	edit.onkeyup = function (e)
	{
		if (e.key === 'Enter') {
			addNewActivity(edit.value);
			parentDiv.replaceChild(addActivityButton, edit);
			parentDiv.style.textAlign = "center";
			populateActivityList();
		}
		else if (e.key === 'Escape') {
			parentDiv.replaceChild(addActivityButton, edit);
			parentDiv.style.textAlign = "center";
		}
	};
	parentDiv.style.textAlign = "left";
	parentDiv.replaceChild(edit, addActivityButton);
	edit.focus();
};

document.getElementById("RedoButton").onclick = function ()
{
	populateBingoTable(true);
	updateBingoState();
};

populateActivityList();
populateBingoTable();
updateBingoState();

var copyright = document.getElementById("copyright");
copyright.innerHTML = "Copyright &copy " + (new Date().getFullYear()) + " niksbenik";
