const express = require("express");
const bodyParser = require("body-parser");
const moongose = require("mongoose")
const _=require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static("public"))

//connection
const MONGO_URL = 'mongodb+srv://ChiragRajoria:*Chirag1234@todo.cc7og.mongodb.net/TodoData?retryWrites=true&w=majority'
moongose.connect(MONGO_URL, {}).then(() => console.log("connection establish"));

//schema
const itemsSchema = {
    name: String
};

//model
const Item = moongose.model("Item", itemsSchema)

const item1 = new Item({
    name: "Welcome to your todoslist!!!"
});
const item2 = new Item({
    name: "Hit the + button to add a new items."
});
const item3 = new Item({
    name: "<-- Hit this to delete this item"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};
const List = moongose.model("List", listSchema);

app.get("/", function (req, res) {

    Item.find({}, function (err, foundItems) {

        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Successfully saved default item to DB");
                }
            });
            res.redirect("/");
        } else {
            res.render("list", { listTitle: "Today", newListItems: foundItems });
        }
    });
});


app.get("/:customListName", function (req, res) {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({ name: customListName }, function (err, foundList) {
        if (!err) {
            if (!foundList) {
                //create a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/"+customListName)
            } else {
                //show an existing list
                res.render("list", { listTitle: foundList.name, newListItems: foundList.items })
            }
        }
    })

})


app.post("/", function (req, res) {
    const itemName = req.body.newItem;
    const listName=req.body.list;

    const item = new Item({
        name: itemName
    });

    if(listName==="Today"){
        item.save();
        res.redirect("/");
    }else{
        List.findOne({name:listName},function(err,foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/"+listName)
        });
    } 
});

app.post("/delete", function (req, res) {
    const checkedItemId = req.body.checkbox;
    const listName=req.body.listName;

    if(listName==="Today"){
        Item.findByIdAndRemove(checkedItemId, function (err) {
            if (!err) {
                console.log("Successfully deleted item");
                res.redirect("/");
            }
        });
    }else{
        List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItemId}}},function(err,foundList){
            if(!err){
                res.redirect("/"+listName);
            }
        })
    }

    
});

app.get("/work", function (req, res) {
    res.render("list", { listTitle: "Work List", newListItems: workItems });
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}


app.listen(port, function () {
    console.log("Server started on port 3000");
})