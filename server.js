// Importar dependencias
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const provincias = require('./provincias'); //Añadir el archivo de provincias


// Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors()); // Permitir peticiones desde cualquier origen
app.use(express.json()); // Parsear JSON en el body de las peticiones

/*EJEMPLOS. Los dejo aquí comentados para poder ir consultándolos
// Ruta principal de bienvenida
app.get('/', (req, res) => {
  res.json({
    mensaje: 'Bienvenido a la API Backend',
    endpoints: {
      '/api/ejemplo': 'Obtiene datos de ejemplo de una API externa',
      '/api/usuarios': 'Obtiene lista de usuarios de ejemplo',
      '/api/usuario/:id': 'Obtiene un usuario específico por ID'
    }
  });
});

// EJEMPLO 1: Endpoint que consulta a una API externa y devuelve los datos
app.get('/api/ejemplo', async (req, res) => {
  try {
    // Hacer petición a API externa (JSONPlaceholder como ejemplo)
    const response = await fetch('https://jsonplaceholder.typicode.com/posts/1');
    
    // Verificar si la respuesta es correcta
    if (!response.ok) {
      throw new Error(`Error en la API externa: ${response.status}`);
    }
    
    // Convertir respuesta a JSON
    const data = await response.json();
    
    // Devolver los datos al cliente
    res.json({
      success: true,
      data: data
    });
    
  } catch (error) {
    console.error('Error al consultar la API:', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al obtener los datos de la API externa',
      detalles: error.message
    });
  }
});

// EJEMPLO 2: Endpoint que obtiene una lista de recursos
app.get('/api/usuarios', async (req, res) => {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/users');
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const usuarios = await response.json();
    
    res.json({
      success: true,
      total: usuarios.length,
      data: usuarios
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al obtener usuarios'
    });
  }
});

// EJEMPLO 3: Endpoint con parámetros dinámicos
app.get('/api/usuario/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const response = await fetch(`https://jsonplaceholder.typicode.com/users/${id}`);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const usuario = await response.json();
    
    res.json({
      success: true,
      data: usuario
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al obtener el usuario'
    });
  }
});

// EJEMPLO 4: Endpoint con query parameters (para filtros, búsquedas, etc.)
app.get('/api/posts', async (req, res) => {
  try {
    // Obtener parámetros de consulta (ej: /api/posts?userId=1)
    const { userId } = req.query;
    
    let url = 'https://jsonplaceholder.typicode.com/posts';
    
    // Si se proporciona userId, filtrar por ese usuario
    if (userId) {
      url += `?userId=${userId}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const posts = await response.json();
    
    res.json({
      success: true,
      total: posts.length,
      filtros: { userId: userId || 'ninguno' },
      data: posts
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al obtener posts'
    });
  }
});*/
//RUTA PRINCIPAL
app.get('/', (req, res) => {
  res.json({
    mensaje: 'Bienvenido a la API del proyecto del tiempo',
    endpoints: {
      '/api/provincia/:codigo/municipios': 'Obtiene los municipios que pertenecen a una provincia',
      '/api/municipio/nombre/:nombre': 'Busca un municipio por su nombre',
      '/api/cp/:codigoPostal': 'Busca un municipio por código postal',
      '/api/prediccion/:idMunicipio': 'Predicción de 7 días',
      '/api/prediccion-horas/:idMunicipio': 'Predicción por horas del día actual'
    }
  });
});


//FUNCIÓN obtenerMunicipios
async function obtenerMunicipios() {
  //Primera petición para obtener el JSON que contiene la URL real
  const response1 = await fetch (`https://opendata.aemet.es/opendata/api/maestro/municipios?api_key=${process.env.AEMET_API_KEY}`);

  //Comprobar que la respuesta responde bien
  if(!response1.ok) {
    throw new Error(`Error HTTP en AEMET: ${response1.status}`);
  }

  //En la respuesta aparece la propiedad datos, que es la que contiene la URL de los municipios
  const datosMunicipios = await response1.json();

  //Segunda petición
  const response2 = await fetch(datosMunicipios.datos);

  if(!response2.ok) {
    throw new Error(`Error al obtener municipios: ${response2.status}`);
  }

  //Devolver el array de municipios
  return await response2.json();
}

//ENDPOINT: Obtener los municipios de una provincia
app.get('/api/provincia/:codigo/municipios', async (req, res) => {
  try {
    const codigoProvincia = req.params.codigo;

    //Tengo que comprobar que el código de provincia existe en mi archivo provincias.js. Si no existe, devuelvo un error
    if(!provincias[codigoProvincia]) {
      return res.status(400).json({
        success: false,
        error: 'Código de provincia no válido'
      });
    }
    //Llamo a la función obtenerMunicipios
    const municipios = await obtenerMunicipios();

    //Filtro los municipios que pertenecen a esa provincia y cojo únicamente el id y el nombre, que es lo que me hace falta para rellenar el desplegable
    const municipiosProvincia = municipios
      .filter(m => m.id_old.startsWith(codigoProvincia))
      .map(m => ({
        id: m.id, //Voy a devolver este id también
        id_old:m.id_old,
        nombre: m.nombre
      }));

    //Devuelvo la información
    res.json({
      success: true,
      provincia: provincias[codigoProvincia],
      codigoProvincia,
      total: municipiosProvincia.length,
      municipios: municipiosProvincia
    });
  }
  catch(error) {
    console.error('Error al obtener municipios: ', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al obtener los municipios de la provincia',
      detalles: error.message
    });
  }
});

//ENDPOINT: Buscar municipio por nombre
app.get('/api/municipio/nombre/:nombre', async (req, res) => {
  try {
    //Paso el nombre introducido por el usuario a minúsculas
    const nombreIntroducido = req.params.nombre.toLowerCase();

    //Obtengo todos los municipios
    const municipios = await obtenerMunicipios();

    //Buscar el municipio que coincide con lo que ha escrito el usuario, me quedo únicamente con el primero que coincide y ahí se para la búsqueda
    //No debe haber dos municipios con el mismo nombre exacto
    const municipioEncontrado = municipios.find(m => m.nombre.toLowerCase() === nombreIntroducido);

    if(!municipioEncontrado) {
      return res.status(404).json({
        success: false,
        error: 'No existe ningún municipio con ese nombre'
      });
    }

    res.json({
      success: true,
      municipio: municipioEncontrado
    });
  }
  catch(error) {
    console.error('Error al buscar municipio: ', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al buscar el municipio por nombre',
      detalles: error.message
    });
  }
});

//ENDPOINT: Buscar municipio por código postal
app.get('/api/cp/:codigoPostal', async (req, res) => {
  try {
    //Código postal que introduce el usuario
    const cpIntroducido = req.params.codigoPostal;

    //Obtengo los municipios
    const municipios = await obtenerMunicipios();

    //Busco el primer municipio que coincida el código postal
    //Me quedo únicamente en el primero y no sigo buscando porque no debería haber dos municipios con el mismo código postal
    const municipioEncontrado = municipios.find(m => m.id_old === cpIntroducido);

    //Si no se encuentra ninguno, se devuelve un error
    if(!municipioEncontrado) {
      return res.status(404).json({
        success: false,
        error: 'No existe ningún municipio con ese código postal'
      });
    }

    //Si lo encuentra, devolver el municipio
    res.json({
      success: true,
      municipio: municipioEncontrado
    });
  }
  catch(error) {
    console.error('Error al buscar por código postal: ', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al buscar el municipio por código postal',
      detalles: error.message
    })
  }
});

//Predicción de 7 días
app.get('/api/prediccion/:idMunicipio', async (req, res) => {
  try {
    //Guardar en idMunicipio el municipio que recibo
    const idMunicipio = req.params.idMunicipio;
    
    //Primera petición a la AEMET
    const response1 = await fetch(`https://opendata.aemet.es/opendata/api/prediccion/especifica/municipio/diaria/${idMunicipio}?api_key=${process.env.AEMET_API_KEY}`);

    if(!response1.ok) {
      throw new Error(`Error HTTP en AEMET: ${response1.status}`);
    }

    //Convertir la respuesta de la primera petición a JSON
    const datosPrediccion = await response1.json();

    //Segunda petición
    const response2 = await fetch(datosPrediccion.datos);

    if(!response2.ok) {
      throw new Error(`Error al obtener predicción: ${response2.status}`);
    }

    //Convertir la respuesta a JSON
    const prediccionDiaria = await response2.json();

    //Me quedo con el primer elemento que contiene los 7 días
    const dias = prediccionDiaria[0].prediccion.dia;

    //Tengo que quedarme solo con lo que necesito de cada dia
    const prediccionDia = dias.map(dia => {
      //FECHA
      const fecha = dia.fecha;

      //ESTADO DEL CIELO
      //Busco el periodo 00-24 para el día completo
      let estado = dia.estadoCielo.find (e => e.periodo === "00-24"); 

      //Si 00-24 no existe o está vacía la descripción, uso el primer periodo que tenga descripción (que exista y no esté vacía)
      if (!estado || !estado.descripcion) {
        estado = dia.estadoCielo.find(e => e.descripcion && e.descripcion !== "");
      }

      //Si no hay nada en todo el día, lo dejo vacío
      const estadoCielo = estado ? estado.descripcion : "";

      //PRECIPITACIONES
      //Periodo 00-24
      let precipitacion = dia.probPrecipitacion.find(p => p.periodo === "00-24");

      //Si 00-24 no existe o si está vacío uso el primer periodo que tenga probabilidad de precipitacion
      if (!precipitacion || precipitacion.value === "") {
        precipitacion = dia.probPrecipitacion.find(p => p.value !== "");
      }

      //Si no aparece nada en todo el día, indico 0%
      const probPrecipitacion = precipitacion ? precipitacion.value : 0;

      //TEMPERATURAS
      //Aquí no hace falta buscar la franja porque, aunque en algunos casos nos da las temperaturas máximas y mínimas en los periodos,
      //siempre nos las da también de todo el dia. Por ejemplo:
      /*"temperatura" : {
        "maxima" : 21, TODO EL DIA
        "minima" : 13, TODO EL DIA
        "dato" : [ {
          "value" : 16,
          "hora" : 6
        }, {
          "value" : 19,
          "hora" : 12
        }, {
          "value" : 17,
          "hora" : 18
        }, {
          "value" : 14,
          "hora" : 24
        } ]
      },*/
      const temperaturaMax = dia.temperatura.maxima;
      const temperaturaMin = dia.temperatura.minima;

      ///VIENTO 
      //Busco el periodo del dia completo
      let viento = dia.viento.find(v => v.periodo === "00-24");

      //Si 00-24 no existe o está vacío, uso el primer periodo que no esté vacío
      if(!viento || !viento.direccion) {
        viento = dia.viento.find(v => v.direccion && v.direccion !== "");
      }
      
      let vientoFinal;
      //Si encuentro un periodo que sea válido, uso sus valores
      if(viento) {
        vientoFinal = {
          direccion: viento.direccion,
          velocidad: viento.velocidad
        };
      }
      //Si no hay ningún dato, devuelvo valores vacíos
      else {
        vientoFinal = {
          direccion: "",
          velocidad: 0
        };
      }

      //Devuelvo los campos que me hacen falta
      return {
        fecha,
        estadoCielo,
        probPrecipitacion,
        temperaturaMax,
        temperaturaMin,
        viento: vientoFinal
      };
    });

    res.json({
      success: true,
      prediccion: prediccionDia
    });
  }
  catch (error) {
    console.error ('Error al obtener la predicción diaria: ', error.message);

    res.status(500).json({
      success: false,
      error: 'Error al obtener la predicción diaria',
      detalles: error.message
    });
  }
});

//ENDPOINT: Predicción por horas
app.get('/api/prediccion-horas/:idMunicipio', async (req, res) => {
  try {
    //Guardo el id del municipio
    const idMunicipio = req.params.idMunicipio;

    //Primera petición
    const response1 = await fetch(`https://opendata.aemet.es/opendata/api/prediccion/especifica/municipio/horaria/${idMunicipio}?api_key=${process.env.AEMET_API_KEY}`);

    if(!response1.ok) {
      throw new Error (`Error HTTP en AEMET: ${response1.status}`);
    }

    //Obtengo la URL 
    const datosPrediccion = await response1.json();

    //Segunda petición
    const response2 = await fetch(datosPrediccion.datos);

    if(!response2.ok) {
      throw new Error(`Error al obtener predicción horaria: ${response2.status}`);
    }

    const prediccionHoraria = await response2.json();

    //Devuelvo la predicción horaria
    res.json({
      success: true,
      prediccion: prediccionHoraria[0]
    });
  }

  catch(error) {
    console.error ('Error al obtener predicción por horas: ', error.message);

    res.status(500).json({
      success: false,
      error: 'Error al obtener la predicción por horas',
      detalles: error.message
    });
  }
});

// Ruta para manejar endpoints no encontrados
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint no encontrado'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📝 Documentación disponible en http://localhost:${PORT}`);
});
