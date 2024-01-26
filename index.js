const express = require("express"); //include express in this app
const path = require("path"); //module to help with file paths

const { MongoClient, ObjectId } = require("mongodb"); //import mongoclient from mongodbmodb
const { request } = require("http");

//DB Values
const dbUrl = "mongodb://127.0.0.1:27017/testdb";
const client = new MongoClient(dbUrl);

const app = express(); //create an Express app
const port = process.env.PORT || "8888";

//SET UP TEMPLATE ENGINE (PUG)
app.set("views", path.join(__dirname, "views")); //set up "views" setting to look in the <__dirname>/views folder
app.set("view engine", "pug"); //set up app to use Pug as template engine

//SET UP A PATH FOR STATIC FILES
app.use(express.static(path.join(__dirname, "public")));

//SET UP for easier form data passing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//SET UP SOME PAGE ROUTES
app.get("/", async (request, response) => {
  let links = await getLinks();
  console.log(links);
  response.render("index", { title: "Home", menu: links });
});

app.get("/about", async (request, response) => {
  let links = await getLinks();
  response.render("about", { title: "About", menu: links });
});

//SET UP menu link for admin TO ADD
app.get("/admin/menu/add", async (request, response) => {
  let links = await getLinks();
  response.render("menu-add", { title: "Add menu link", menu: links });
});
//SET UP PAGE FOR ADMIN TO MANAGE LINKS
app.get("/admin/menu", async (request, response) => {
  let links = await getLinks();
  response.render("menu-admin", { title: "Menu links admin", menu: links });
});

//DELETE FUNCTION FOR ADMIN
app.get("/admin/menu/delete", async (request, response) => {
  //get linkId value
  let id = request.query.linkId;
  await deleteLink(id);
  response.redirect("/admin/menu");
});

//UPDATE FUNCTION FOR ADMIN

app.get("/admin/menu/edit", async (request, response) => {
  if (request.query.linkId) {
    let linkToEdit = await getSingleLink(request.query.linkId);
    let links = await getLinks();
    response.render("menu-edit", {
      title: "Edit menu link",
      menu: links,
      editLink: linkToEdit,
    });
  } else {
    response.redirect("/admin/menu");
  }
});
//ADMIN new form process
app.post("/admin/menu/add/submit", async (request, response) => {
  let weight = request.body.weight;
  let href = request.body.path;
  let link = request.body.name;

  var newLink = { weight: weight, path: href, name: link };
  await addLink(newLink);
  response.redirect("/admin/menu"); //redirect back to admin page
});

//ADMIN update form process
app.post("/admin/menu/edit/submit", async (request, response) => {
  try {
    let idFilter = { _id: new ObjectId(request.body.linkId) };
    let link = {
      weight: request.body.weight,
      path: request.body.path,
      name: request.body.name,
    };

    await updateLink(idFilter, link);

    response.redirect("/admin/menu"); // Redirect back to admin page
  } catch (error) {
    console.error(error);
    response.status(500).send("Internal Server Error");
  }
});

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});

//MONGODB Function
async function connection() {
  db = client.db("testdb"); //if client.db() is blank it will consider the default database.
  return db;
}

//Function to select all documents in the menuLinks collection.
async function getLinks() {
  db = await connection();
  let results = db.collection("menuLinks").find({});
  let res = await results.toArray();
  return res;
}

//FUNCTION for admin to add new link for the menu
async function addLink(link) {
  db = await connection();
  var status = await db.collection("menuLinks").insertOne(link);
  console.log(status);
}

// Function to update a link
async function updateLink(idFilter, updatedValues) {
  try {
    const db = await connection();
    const result = await db
      .collection("menuLinks")
      .updateOne(idFilter, { $set: updatedValues });
    console.log(result);
  } catch (error) {
    throw error;
  }
}
// Function to delete a link
async function deleteLink(id) {
  db = await connection();
  const deleteId = { _id: new ObjectId(id) };
  const result = await db.collection("menuLinks").deleteOne(deleteId);
  if (result.deletedCount == 1) {
    console.log("delete successful");
  }
}
// Function to get a single link
async function getSingleLink(id) {
  db = await connection();
  const editId = { _id: new ObjectId(id) };
  const result = await db.collection("menuLinks").findOne(editId);
  console.log(result);
  return result;
}
