import bcrypt from "bcryptjs"
import dotenv from "dotenv";
import { Router } from "express";
import jsonwebtoken from "jsonwebtoken";
import cookieParser from "cookie-parser";
import User from "../models/userSchema.js";

dotenv.config({ path: "./config.env" });

const userRoutes = Router();

userRoutes.use(cookieParser());

userRoutes.get("/", async (req, res) => {
    res.send("Home Route");
})

userRoutes.post("/user/register", async (req, res) => {

    console.log("register route");
    console.log(req.body);
    const { username, aliasName, password } = req.body;
    console.log(username, aliasName, password);

    try {
        const findUser = await User.findOne({ username: username });

        if (!findUser) {

            const hash = await bcrypt.hash(password, 12);

            const user = new User({ username, aliasName, password: hash });

            await user.save();
            res.send("User Saved Successfully");
        }

    }
    catch (err) {
        console.log("Error", err);
    }
});

userRoutes.post("/user/login", async (req, res) => {

    const { username, password } = req.body;

    try {
        const findUser = await User.findOne({ username: username });

        if (findUser) {

            const isMatch = bcrypt.compare(password, findUser.password);

            if (isMatch) {

                // Generating token using jsonwebtoken
                let token = jsonwebtoken.sign({ _id: findUser._id }, process.env.SECRET_KEY);
                findUser.tokens = findUser.tokens.concat({ token: token });

                // Creating cookie using the generated token
                res.cookie("jwtoken", token, {
                    expiresIn: new Date(Date.now() + 86400000),
                    httpOnly: false
                });

                await findUser.save();
                res.send("User Logged Successfully");
                return res.json({ message: "User Login Successfull!!!" });

            } else {
                return res.status(401).json({ error: "Invalid Credentials!!! pass" });
            }

        }

    }
    catch (err) {
        console.log("Error", err);
    }

});

userRoutes.post('/user/create-poll', async (req, res) => {

    try {

        console.log(req.body);
        const token = req.body.cookieValue;

        const verifyToken = jsonwebtoken.verify(token, process.env.SECRET_KEY);

        const rootUser = await User.findOne({ _id: verifyToken._id, "tokens.token": token });

        if (!rootUser) { throw new Error("User Not Found") }

        const { question, options } = req.body.pollData;

        if (!question || !options || options.length < 2) {
            return res.status(400).json({ error: 'Invalid poll data' });
        }

        console.log(rootUser);
        const newPoll = {
            creator: rootUser.aliasName,
            question,
            options: options.map((optionText) => ({ optionText })),
        };

        rootUser.polls.push(newPoll);

        await rootUser.save();

        return res.status(201).json({ message: "Poll created Successfully" })

    } catch (error) {
        console.log(error);
    }
});

userRoutes.get('/user/timeline', async (req, res) => {
    try {
        // Fetch all polls from all users
        const allPolls = await User.find({}, 'polls');
        
        // Flatten the polls array
        const flattenedPolls = allPolls.flatMap((user) => user.polls);
        
        // Get the username from the request query
        const username = req.query.username;

        // Iterate through polls and options, set 'selected' and 'hasVoted' fields
        const pollsWithSelection = flattenedPolls.map((poll) => {
            const selectedOptions = poll.votedUsers
                .filter((votedUser) => votedUser.votedUser === username)
                .map((votedUser) => votedUser.option);

            const optionsWithSelection = poll.options.map((option, index) => ({
                optionText: option.optionText,
                votes: option.votes,
                selected: selectedOptions.includes(index),
            }));

            const hasVoted = selectedOptions.length > 0;

            return {
                _id:poll._id,
                creator: poll.creator,
                question: poll.question,
                options: optionsWithSelection,
                hasVoted,
                votedUserCount: poll.votedUserCount,
            };
        });
        pollsWithSelection.forEach(element => {
            console.log(element);
            element.options.forEach((option)=>{
                console.log(option);
            })
        });
        console.log(pollsWithSelection);
        res.status(200).json(pollsWithSelection);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



userRoutes.post('/user/vote', async (req, res) => {

    console.log(req.body);
    console.log("Chipi chipi");
    const { pollId, optionIndex, username } = req.body;

    try {
        // Find the user
        const user = await User.findOne({ username: username });
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Find the poll globally across all users
        const poll = await User.findOne({ 'polls._id': pollId }, 'polls.$');
        if (!poll) {
            return res.status(401).json({ error: 'Poll not found' });
        }

        // Check if the user has already voted
        if (poll.polls[0].votedUsers.some((votedUser) => votedUser.votedUser === username)) {
            return res.status(400).json({ error: 'User already voted on this poll' });
        }

        console.log("user not voted ");

        const updateQuery = {
            $inc: {
                [`polls.$[pollIndex].options.${optionIndex}.votes`]: 1,
                'polls.$[pollIndex].votedUserCount': 1
            },
            $push: {
                'polls.$[pollIndex].votedUsers': { votedUser: username, option: optionIndex }
            },
        };

        const arrayFilters = [{ 'pollIndex._id': pollId }];

        await User.updateOne({ 'polls._id': pollId }, updateQuery, { arrayFilters });

        // Save the updated user document
        await poll.save();

        res.status(200).json({ message: 'Vote recorded successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default userRoutes;