<template>
  <h1>To Do</h1>
  <div class="form">
    <input type="text" v-model="title" placeholder="Title">
    <input type="text" v-model="description" placeholder="Description">
    <button @click="addNewTask">Add</button>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
  <div v-for="(task, index) in shownTasks" :key="task.id" :class="{'todo':true, 'todo-done':task.done}">
    <input type="checkbox" :checked="task.done" @click="markTaskAsDone(index)">
    <div>
      <p>Title: {{ task.title }}</p>
      <p>Description: {{ task.description }}</p>
    </div>
    <button @click="deleteTask(index)">Delete</button>
  </div>
  <button @click="checkDocument">Check Document</button>
</template>

<script setup>
import { ref,  toRaw} from 'vue';

import { isValidAutomergeUrl, Repo } from "@automerge/automerge-repo";
import { BrowserWebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket";
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb";

const repo = new Repo({
  network: [new BrowserWebSocketClientAdapter("ws://localhost:8080")],
  storage: new IndexedDBStorageAdapter("to-do-index"),
});

const ws = new WebSocket("ws://localhost:8080");

ws.onopen = () => {
  console.log("Connected to WebSocket server");
};

ws.onerror = (error) => {
  console.error("WebSocket error:", error);
};

// Listen for messages from the server and update the local state accordingly
ws.onmessage = (event) => {
  console.log(event.data);

};

// Form variables
const title = ref("");
const description = ref("");
const error = ref("");

// Automerge

// A Repo is the methods of storage
// A DocHandle helps you track and manage documents
// A document is the "unit of change" in auto merge

const handle = ref(setRepo());
const shownTasks = ref([]);

function setRepo(){
  const rootDocUrl = document.location.hash.substring(1);
  let repoHandle;
  if(isValidAutomergeUrl(rootDocUrl)){
    repoHandle = repo.find(rootDocUrl);
  } else {
    repoHandle = repo.create({tasks: []})
  }

  document.location.hash = repoHandle.url;

  toRaw(repoHandle).doc().then((doc) => {
    shownTasks.value = doc.tasks;
  })

  return repoHandle;
}

toRaw(handle.value).on("change", ({doc}) => {
  shownTasks.value = doc.tasks;
});

function addNewTask(){
  error.value = "";

  if(title.value === "" || description.value === ""){
    error.value = "Please fill out inputs";
    return;
  }

  const taskStructure = {
    id: new Date(),
    title: title.value,
    description: description.value,
    done: false
  }

  toRaw(handle.value).change(doc => {
    doc.tasks.push(taskStructure)
    shownTasks.value = doc.tasks;
  });

  title.value = "";
  description.value = "";
}

function markTaskAsDone(index){
  toRaw(handle.value).change(doc => {
    doc.tasks[index].done = !doc.tasks[index].done;
    shownTasks.value = doc.tasks;
  });
}

function deleteTask(index){
  toRaw(handle.value).change(doc => {
    doc.tasks.splice(index, 1);
    shownTasks.value = doc.tasks;
  });
}

function checkDocument(){
  // console.log(toRaw(shownTasks.value))
  console.log(toRaw(handle.value).docSync())
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
}

p {
  margin: 0;
}

.todo {
  border: 2px gray solid;
  padding: 10px;
  margin-bottom: 10px;

  display: flex;
  gap: 20px;
}

.todo button {
  align-self: center;
  margin-left: auto;
}

.todo-done {
  background-color: lightgray;
}

.todo-done p {
  text-decoration: line-through;
}

.form {
  margin: 10px 0;
  display: flex;
  gap: 10px;
}

.error {
  color: red;
}
</style>
