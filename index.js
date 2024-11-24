const express = require('express');
const app = express();
const port = 3000;
const moduleRouter = require('./routes/router');

app.use(express.json());
app.use(express.urlencoded({ extended: true}));
app.use(moduleRouter);

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})