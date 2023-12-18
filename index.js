const express = require('express');
const cors = require('cors')
const {PORT=5000} = require('./src/config')
const {dbConnect} = require('./src/app/utils/DbConnection')
const app = express();
app.use(cors())
app.use(express.json())
app.use('/api',require('./src/routes'))
app.listen(PORT,()=>{
    console.log('SE ESTA CORRIENDO EL APP: http://localhost:'+PORT);
});
dbConnect()