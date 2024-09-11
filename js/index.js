let curComments;
let curUser;

const commentsContainer = document.querySelector(".comments");

const btnCreateComm = document.querySelector(".btn--create");

const inputComm = document.querySelector(".create-comment__input");
const inputReply = document.querySelector(".create-reply__input");

const deleteModal = document.querySelector(".delete-modal");

function getData(file) {
	return new Promise((res, rej) => {
		fetch(file)
			.then((res) => res.json())
			.then((data) => res(data));
	});
}

function renderHTML(parentEl, html, type, clean = false) {
	clean ? (parentEl.innerHTML = "") : "nothing";
	return parentEl.insertAdjacentHTML(type, html);
}

function checkCurUser(data) {
	return curUser.username === data.user.username;
}

function createCommObj(user, content, score, createdAt = Date.now(), replies = []) {
	return {
		id: String(Date.now()),
		user,
		content,
		createdAt: new Date(createdAt).toLocaleString("en-US", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		}),
		score,
		replies,
	};
}

function createReplyObj(user, repliedTo, content, score, replies = []) {
	const newObj = createCommObj(user, content, score);
	newObj.replyingTo = repliedTo;
	return newObj;
}

function joinTemplate(arr, template) {
	const fullTemp = arr.map((obj) => template(obj)).join(" ");
	return fullTemp;
}

function changeUserCommInterface(user) {
	if (curUser.username !== user) {
		return `
		<div class="comment__reply">
			<img src="/images/icon-reply.svg" alt="Reply Icon" />
			</svg>
			Reply
		</div>
		`;
	}

	return `
		<div class="comment__delete">
			<img src="/images/icon-delete.svg" alt="Delete Icon" />
			Delete
		</div>
		<div class=comment__edit>
			<img src="/images/icon-edit.svg" alt="Edit Icon" />
			Edit		
		</div>
	`;
}

function createCommentTemplate(data) {
	return `
	<div class="comment" id="${data.id}">
		<div class="comment__content">
			<div class="comment__likes-box">
				<span class="comment__like">+</span>
				<span class="comment__likes-quantity">${data.score}</span>
				<span class="comment__dislike">-</span>
			</div>
		
			<div class="comment__user-box">
				<div class="comment__user-img">
					<img
					src="${data.user.image.png}"
					alt="Image of an USER"
					/>
				</div>
				<p class="comment__user-name">${data.user.username}</p>
				<p class="comment__you ${checkCurUser(data) ? "" : "content--hidden"}">you</p>
				<p class="comment__post-time">${data.createdAt}</p>
			</div>

			<div class="comment__reply-box" value-id="${data.id}">
				${changeUserCommInterface(data.user.username)}
			</div>

			<p class="comment__text">
				${data.replyingTo ? `<a class="comment__replying-to" href="#">@${data.replyingTo}</a>` + data.content : data.content}

				<div class="edit content--hidden">
					<textarea name="edit" id="edit" class="edit__input">${data.content}</textarea>
					<a class="btn btn--create btn-edit">Update</a>
				</div>
			</p>
		</div>
			
		<div class="create-reply ">
			<img
				src="${curUser.image.png}"
				alt="Image of an CURRENT USER"
				class="create-reply__img"
			/>
			<textarea
				name="new-reply"
				id="new-reply"
				class="create-reply__input"
				placeholder="Add a Reply..."></textarea>
				<a class="btn btn--create btn-reply">Reply</a>
		</div>

		<div class="comment__replies">
			${data.replies ? joinTemplate(data.replies, createCommentTemplate) : ""}
		</div>
	</div>
`;
}

getData("/data.json").then((data) => {
	curComments = data.comments;
	curUser = data.currentUser;
	localStorage.setItem("user", JSON.stringify(curUser));
	localStorage.setItem("comments", JSON.stringify(curComments));

	document.querySelector(".create-comment__img").src = curUser.image.png;
	renderHTML(commentsContainer, joinTemplate(curComments, createCommentTemplate), "beforeend");
});

function findCommentById(id, comments, parentArr = null) {
	let curObj;
	for (const comment of comments) {
		if (comment.id == id) {
			curObj = comment;
			return { curObj, parentArr: parentArr || comments };
		}

		if (comment.replies.length) {
			curObj = findCommentById(id, comment.replies, comment.replies);
			if (curObj) return curObj;
		}
	}

	return null;
}

function deleteCommentById(id, comments) {
	for (let i = 0; i < comments.length; i++) {
		const comment = comments[i];

		if (comment.id == id) {
			comments.splice(i, 1);
			return true;
		}

		if (comment.replies.length) {
			const isDeleted = deleteCommentById(id, comment.replies);
			if (isDeleted) return true;
		}
	}

	return false;
}

function createNewComment(input) {
	const newComm = createCommObj(curUser, input, 0);
	curComments.push(newComm);
	return renderHTML(commentsContainer, createCommentTemplate(newComm), "beforeend");
}

function selectCurComm(target) {
	const curComm = target.closest(".comment");
	const { id } = curComm;
	const { curObj, parentArr } = findCommentById(id, curComments);
	const reply = curComm.querySelector(".create-reply");
	const edit = curComm.querySelector(".edit");

	return { curComm, curObj, parentArr, reply, edit, id };
}

function handleReplySubmit(curComm, curObj, reply) {
	const input = curComm.querySelector(".create-reply__input");
	if (!input.value) return;

	const newReplyObj = createReplyObj(curUser, curObj.user.username, input.value, 0);
	curObj.replies.push(newReplyObj);

	renderHTML(curComm.querySelector(".comment__replies"), createCommentTemplate(newReplyObj), "beforeend");
	reply.classList.remove("content--active");

	input.value = "";
}

function handleEdit(curComm, curObj, edit) {
	const input = curComm.querySelector(".edit__input");
	if (!input.value) return;
	curObj.content = input.value;
	edit.classList.add("content--hidden");
	return (curComm.querySelector(".comment__text").innerHTML = curObj.replyingTo
		? `<a class="comment__replying-to" href="#">@${curObj.replyingTo}</a>` + curObj.content
		: curObj.content);
}

btnCreateComm.addEventListener("click", (e) => {
	if (inputComm.value.length < 1) return;
	createNewComment(inputComm.value);
	return (inputComm.value = "");
});

let curCommStats;
document.body.addEventListener("click", (e) => {
	e.preventDefault();
	const { target } = e;

	if (target.classList.contains("comment__reply")) {
		const { curComm, curObj, reply } = selectCurComm(target);

		curComm.querySelector(".create-reply").classList.toggle("content--active");
		return { curComm, curObj, reply };
	}

	if (target.classList.contains("btn-reply")) {
		const { curComm, curObj, reply } = selectCurComm(target);
		return handleReplySubmit(curComm, curObj, reply);
	}

	if (target.classList.contains("comment__edit")) {
		const { edit } = selectCurComm(target);
		return edit.classList.toggle("content--hidden");
	}

	if (target.classList.contains("btn-edit")) {
		const { curComm, curObj, edit } = selectCurComm(target);
		return handleEdit(curComm, curObj, edit);
	}

	if (target.classList.contains("comment__delete")) {
		curCommStats = selectCurComm(target);
		return deleteModal.classList.add("delete-modal--active");
	}

	if (target.classList.contains("btn-cancel")) {
		curCommStats = {};
		return deleteModal.classList.remove("delete-modal--active");
	}

	if (target.classList.contains("btn-delete")) {
		const { id } = curCommStats;
		const deleted = deleteCommentById(id, curComments);
		if (deleted) renderHTML(commentsContainer, joinTemplate(curComments, createCommentTemplate), "beforeend", true);

		return deleteModal.classList.remove("delete-modal--active");
	}
});
