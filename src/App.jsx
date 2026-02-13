import { useState, useEffect } from 'react'
import './App.css'

/*Función para obtener un icono segun la descripción del estado del cielo, me gusta así porque lo hace más visual
y casi todas las aplicaciones y webs del tiempo lo tienen.*/
function iconoDescripcion(descripcion) {
   //En el caso de que no haya descripción, dejar en blanco
  if(!descripcion) return " ";

  //Pasar toda la descripcion a minúsculas y almacenar en texto
  const texto = descripcion.toLowerCase();

  //Tormenta
  if(texto.includes("tormenta")) return "⛈️";

  //Nieve
  if(texto.includes("nieve")) return "❄️";

  //Lluvia, llovizna o chubascos
  //Pongo "lluvi" para que detecte lluvia, lluvias y lluvioso
  if (texto.includes("lluvi") || texto.includes("chubasco") || texto.includes("llovizna")) return "🌧️";

  //Niebla, bruma o calima
  if (texto.includes("niebla") || texto.includes("bruma") || texto.includes("calima")) return "🌫️";

  //Parcialmente soleado
  if (texto.includes("parcialmente soleado")) return "🌤️";

  //Poco nuboso, intervalos nubosos o nubes altas
  if (texto.includes("poco nuboso") || texto.includes("intervalos nubosos") || texto.includes ("nubes altas")) return "⛅";

  //Nuboso, muy nuboso, cubierto
  if(texto.includes("nuboso") || texto.includes ("muy nuboso") || texto.includes("cubierto")) return "⛅";

  //Soleado, despejado
  if(texto.includes("despejado")) return "☀️";

  //En el caso de que no coincida ninguna descripción, dejar en blanco
  return " ";
}

function App() {
  //useState para guardar variables
  //Guardar las selecciones del usuario en el formulario
  const [nombreMunicipio, setNombreMunicipio] = useState("");
  const [provinciaSeleccionada, setProvinciaSeleccionada] = useState("");
  const [municipioSeleccionado, setMunicipioSeleccionado] = useState("");

  //Provincias y municipios
  const [provinciasLista, setProvinciasLista] = useState([]);
  const [municipiosLista, setMunicipiosLista] = useState([]);

  //Predicción diaria y por horas
  const [prediccionDiaria, setPrediccionDiaria] = useState(null);
  const [prediccionHorasComp, setPrediccionHorasComp] = useState(null);
  const [prediccionHoras, setPrediccionHoras] = useState(null);
  const [diaPredHoras, setDiaPredHoras] = useState(null)

  //Mensajes de error y cargando
  const [cargando, setCargando] = useState(false);
  const[error, setError] = useState("");

  //Cargar provincias desde provincias.json
  useEffect(() => {
    import("./provincias.json")
    .then((modulo) => {setProvinciasLista(modulo.default);})
    .catch(() => {setError("Error al cargar las provincias");
    });
  }, []);

  //Cargar los municipios al cambiar la provincia
  useEffect(() => {
    if(provinciaSeleccionada === "") {
      setMunicipiosLista([]);
      return;
    }
    /*La API devuelve el id_old con formato XXXXX, en el caso de números menores a 10, por ejemplo: 01XXX 
    tengo que convertirlo, ya que en el json uso los números del 1 al 50.
    Lo soluciono de esta manera: Si la provincia solo tiene un dígito, el codigoProvincia va a ser 0 seguido de ese número.
    Si no, es el número que ya tenía*/
    const codigoProvincia = provinciaSeleccionada.length === 1 ? "0" + provinciaSeleccionada : provinciaSeleccionada;

    fetch(`http://localhost:3000/api/provincia/${codigoProvincia}/municipios`)
      .then((res) => res.json())
      .then((data) => {
        if(data.success) {
          setMunicipiosLista(data.municipios);
        }
        else {
          setError("No se ha podido cargar los municipios");
        }
      })
      .catch(()=> {
        setError("Error al conectar con el servidor");
      });
    }, [provinciaSeleccionada]);

   //Mostrar la fecha en formato: DD/MM
  function formatearFecha(fechaEntrada) {
    const fecha = new Date(fechaEntrada);
    const dia = fecha.getDate().toString().padStart(2, "0");
    const mes = (fecha.getMonth() + 1).toString().padStart(2, "0");
    return `${dia}/${mes}`;
  }

  //Calcular la media de las temperaturas en las franjas horarias para ofrecer una temperatura general
  //Esto no aparece todos los días, solo los más cercanos
  function calcularTemperatura(dia) {
  //En los días en los que no hay datos de temperatura general, no se devuelve nada
    if(!dia.temperatura.dato || dia.temperatura.dato.length === 0) {
      return "";
    }
    
    const valoresTemperatura = dia.temperatura.dato.map(t => t.value);
    const media = Math.round(valoresTemperatura.reduce((a, b) => a + b, 0) / valoresTemperatura.length);
    return `${media}ºC`;
  }


  //Búsqueda manual por nombre de municipio
  const busquedaManual = async () => {
    setError("");
    setCargando(true);
    setPrediccionDiaria(null);

    try {
      const response = await fetch (`http://localhost:3000/api/municipio/nombre/${nombreMunicipio}`);
      const datos = await response.json();

      if(!datos.success) {
        setError(datos.error);
        setCargando(false);
        return;
      }

      const idMunicipio = datos.municipio.id;

      const response2 = await fetch(`http://localhost:3000/api/prediccion/${idMunicipio}`);
      const datos2 = await response2.json();

      if(!datos2.success) {
        setError(datos2.error);
        setCargando(false);
        return;
      }

      setPrediccionDiaria(datos2.prediccion);
    }
    catch(error) {
      setError("Error al conectar con el servidor");
    }
    setCargando(false);
  }

  //Búsqueda por desplegables
  const busquedaDesplegables = async () => {
    setError("");
    setCargando(true);
    setPrediccionDiaria(null);

    try {
      const idMunicipio = municipioSeleccionado;

      if(!idMunicipio) {
        setError("Debe seleccionar un municipio");
        setCargando(false);
        return;
      }

      const response = await fetch(`http://localhost:3000/api/prediccion/${idMunicipio}`);
      const datos = await response.json();

      if(!datos.success) {
        setError(datos.error);
        setCargando(false);
        return;
      }

      setPrediccionDiaria(datos.prediccion);
    }
    catch(error) {
      setError("Error al conectar con el servidor");
    }
    setCargando(false);
  };

  return (
    <div className="contenedor">
      <h1 className="titulo">PROYECTO APLICACIÓN DEL TIEMPO</h1>
      <div className="contenedor-busquedas">

        {/*Búsqueda manual*/}
        <div className="contenedor-busqueda">
          <h3>Búsqueda manual por municipio</h3>
          <input type="text" placeholder="Introduzca un municipio" value={nombreMunicipio} onChange={(e) => setNombreMunicipio(e.target.value)}/>
          <button onClick={busquedaManual}>Aceptar</button>
        </div>

        {/*Separador entre tipos de búsqueda*/}
        <div className="separador"></div>

        {/*Búsqueda con desplegables*/}
        <div className="contenedor-busqueda">
          <h3>Búsqueda por provincia y municipio</h3>
          <select value={provinciaSeleccionada} onChange={(e) => setProvinciaSeleccionada(e.target.value)}>
            <option value="">Seleccione la provincia</option>
            {/*Rellenar el resto con las provincias*/}
            {provinciasLista.map((prov) => (
              <option key={prov.codigo} value={prov.codigo}>{prov.nombre}</option>
            ))}
          </select>
          <select value={municipioSeleccionado} onChange={(e) => setMunicipioSeleccionado(e.target.value)}>
            <option value="">Seleccione el municipio</option>
            {/*Rellenar el resto con los municipios*/}
            {municipiosLista.map((mun) => (
              <option key={mun.id} value={mun.id}>{mun.nombre}</option>
            ))}
          </select>
          <button onClick={busquedaDesplegables}>Aceptar</button>
        </div>
      </div>

      {/*RESULTADOS*/}
      <div className="contenedor-resultados">
        {cargando && <p>Cargando...</p>}
        {error && <p className="error">{error}</p>}

        {/*Predicción por días*/}
        {prediccionDiaria && (
          <table className="tabla-prediccion">
            <tr>
              <td className="encabezado-vacio"></td>
              {prediccionDiaria.map((dia, index) => {
                const fechaFormateada = formatearFecha(dia.fecha);
                return (<td key={index} className={"celda-fecha"}>{fechaFormateada}</td>);
              })}
            </tr>
            <tr>
              <td className="encabezado-vacio"></td>
              {prediccionDiaria.map((dia, index) => {
                const temperaturaDia = calcularTemperatura(dia);
                
                return (<td key={index} className={"temp-dia"}>{temperaturaDia}ºC</td>);
              })}
            </tr>
            <tr>
              <td className="encabezado-vacio"></td>

              {prediccionDiaria.map((dia, index) => (
                <td key={index} className="icono-cielo">{iconoDescripcion(dia.estadoCielo)}</td>
              ))}
            </tr>
            <tr>
              <td className="encabezado">Temperaturas</td>
              {prediccionDiaria.map((dia, index) => (
                <td key={index} className="temp">
                  <span className="temp-min">{dia.temperaturaMin}ºC</span>
                  <span className="temp-max">{dia.temperaturaMax}ºC</span>
                </td>
              ))}
            </tr>
            <tr>
              <td className="encabezado">Precipitaciones</td>
              {prediccionDiaria.map((dia, index) => (
                <td key={index}>{dia.probPrecipitacion}%</td>
              ))}
            </tr>
            <tr>
              <td className="encabezado">Viento</td>
              {prediccionDiaria.map((dia, index) => (
                <td key={index} className="viento">
                  <span>{dia.viento.direccion}</span>
                  <span>{dia.viento.velocidad} km/h</span>
                </td>
              ))}
            </tr>
          </table>
        )}
      </div>
    </div>
  );
}

export default App
