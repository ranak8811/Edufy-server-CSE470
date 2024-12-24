const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 4000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.j5yqq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    //---------------------------------------------------------------- me started

    // database creation ar jonno for users
    const usersCollection = client.db("coursesDB").collection("users");

    // database creation ar jonno for courses
    const courseCollection = client.db("coursesDB").collection("courses");

    const enrolledCourseCollection = client
      .db("coursesDB")
      .collection("enrolledCourses");

    const progressCollection = client.db("coursesDB").collection("progress");

    const reviewsCollection = client.db("coursesDB").collection("reviews");
    const bookmarksCollection = client.db("coursesDB").collection("bookmarks");
    const announcementCollection = client
      .db("coursesDB")
      .collection("announcement");
    const notesCollection = client.db("coursesDB").collection("courseNotes");

    // course dekhanor jonno
    app.get("/courses", async (req, res) => {
      const { searchParams } = req.query;

      let option = {};
      if (searchParams) {
        option = {
          course_name: { $regex: searchParams, $options: "i" },
        };
      }
      const cursor = courseCollection.find(option);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/courses/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await courseCollection.findOne(query);
      res.send(result);
    });

    // course create korar jonno
    app.post("/courses", async (req, res) => {
      const newCourse = req.body;
      console.log(newCourse);

      const result = await courseCollection.insertOne(newCourse);
      res.send(result);
    });

    app.put("/courses/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: false };

      const { _id, ...updateData } = req.body;

      const updatedDoc = {
        $set: updateData,
      };

      try {
        const result = await courseCollection.updateOne(
          filter,
          updatedDoc,
          options
        );
        res.send(result);
      } catch (error) {
        console.error("Error updating course:", error);
        res.status(500).send({ message: "Failed to update course", error });
      }
    });

    app.delete("/courses/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await courseCollection.deleteOne(query);
      res.send(result);
    });

    app.post("/bookmarks", async (req, res) => {
      const newCourse = req.body;
      console.log(newCourse);

      const result = await bookmarksCollection.insertOne(newCourse);
      res.send(result);
    });

    app.get("/bookmarks/:email", async (req, res) => {
      const email = req.params.email;
      const query = { bookmarkedEmail: email };
      const courses = await bookmarksCollection.find(query).toArray();
      res.send(courses);
    });

    app.post("/announcement", async (req, res) => {
      const newAnnoucement = req.body;
      console.log(newAnnoucement);

      const result = await announcementCollection.insertOne(newAnnoucement);
      res.send(result);
    });

    app.get("/announcement", async (req, res) => {
      const result = await announcementCollection.find().toArray();
      res.send(result);
    });

    //------------------- enrolled course related backend api start

    app.post("/enrolledCourses", async (req, res) => {
      const newEnrolledCourse = req.body;
      const result = await enrolledCourseCollection.insertOne(
        newEnrolledCourse
      );
      res.send(result);
    });

    // Get courses enrolled by user
    app.get("/enrolledCourses", async (req, res) => {
      const userEmail = req.query.email;
      const query = { userEmail };
      const courses = await enrolledCourseCollection.find(query).toArray();
      res.send(courses);
    });

    // Initialize progress for a course
    app.post("/progress", async (req, res) => {
      const { userEmail, courseId, courseName } = req.body;
      const progress = { courseName, userEmail, courseId, completedModules: 0 };
      console.log(progress);
      const result = await progressCollection.insertOne(progress);
      res.send(result);
    });

    // Update progress for a course
    app.patch("/progress/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const result = await progressCollection.updateOne(
        { _id: new ObjectId(id) },
        { $inc: { completedModules: 1 } }
      );
      res.send(result);
    });

    // Get progress for a user in a specific course
    app.get("/progress", async (req, res) => {
      const { userEmail, courseId } = req.query;
      const query = { userEmail, courseId };
      const progress = await progressCollection.findOne(query);
      res.send(progress);
    });

    // Add review and rating
    app.post("/reviews", async (req, res) => {
      const review = req.body;
      const result = await reviewsCollection.insertOne(review);
      res.send(result);
    });

    app.get("/reviews", async (req, res) => {
      const result = await reviewsCollection.find().toArray();
      res.send(result);
    });

    // delete review for a course
    app.delete("/reviews/:courseId", async (req, res) => {
      const courseId = req.params.courseId;
      const query = { _id: new ObjectId(courseId) };
      const reviews = await reviewsCollection.deleteOne(query);
      res.send(reviews);
    });

    app.get("/highRatedCourses", async (req, res) => {
      const cursor = reviewsCollection.find().sort({ rating: -1 }).limit(5);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/notes", async (req, res) => {
      const note = req.body;
      const result = await notesCollection.insertOne(note);
      res.send(result);
    });

    app.get("/notes/:email", async (req, res) => {
      const email = req.params.email;
      const query = {
        userEmail: email,
      };
      const courses = await notesCollection.find(query).toArray();
      res.send(courses);
    });

    //------------------- enrolled course related backend api end

    //---------------------------- users related backend api --------------------

    app.get("/users", async (req, res) => {
      const cursor = usersCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/userType", async (req, res) => {
      const userEmail = req.query.email;
      const query = { email: userEmail };
      // console.log(query);
      const cursor = usersCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const newUser = req.body;
      console.log("Creating new user: ", newUser);

      const result = await usersCollection.insertOne(newUser);
      res.send(result);
    });

    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });

    //---------------------------- users related backend api --------------------

    //---------------------------------------------------------------- me stopped
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Edufy server is running...");
});

app.listen(port, () => {
  console.log(`Edufy server is running on port: ${port}`);
});
