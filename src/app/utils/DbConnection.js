const { BD_URI } = require('../../config')
const mongoose = require('mongoose');
const dbConnect = async () => {
  try {
    await mongoose.connect(BD_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('** CONEXION CORRECTA **');
  } catch (err) {
    console.error('*** ERROR DE CONEXION **', err.message);
  }

}

module.exports = { dbConnect }