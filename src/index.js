import app from './server';

app.listen(process.env.PORT || 8080, () => {
    console.log(`Listen on port ${process.env.PORT || 8080}`);
});