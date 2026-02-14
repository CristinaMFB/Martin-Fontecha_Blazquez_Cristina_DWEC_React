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

    const codigoProvincia = provinciaSeleccionada;

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

  /*Unir los datos de la predicción horaria por hora. La AEMET nos devuelve los datos y dentro de cada dato las horas. 
  Por ejemplo: 
    "estadoCielo" : [ {
        "value" : "11n",
        "periodo" : "07",
        "descripcion" : "Despejado"
      }, {
        "value" : "11",
        "periodo" : "08",
        "descripcion" : "Despejado"
      }, {
        "value" : "11",
        "periodo" : "09",
        "descripcion" : "Despejado"
      }, 
  Pero yo quiero sacar todos los datos de la misma hora. Además, tengo que tener en cuenta que el día actual no suele tener todas
  las horas.*/
  function unirDatosHora(dia) {
    //Horas que devuelve AEMET
    const horasDisponibles = dia.estadoCielo.map(h => h.periodo);

    //Creo un array final solo con esas horas
    const horas = horasDisponibles.map(h => ({
      hora: h,
      estadoCielo: dia.estadoCielo.find(e =>e.periodo === h)?.descripcion || "",
      temperatura: dia.temperatura.find(t => t.periodo === h)?.value || "",
      precipitacion: dia.precipitacion.find(p => p.periodo === h)?.value || "",
      viento: {
        direccion:dia.vientoAndRachaMax.find(v => v.periodo === h)?.direccion?.[0] || "",
        velocidad: dia.vientoAndRachaMax.find(v => v.periodo === h)?.velocidad?.[0] || ""
      }
    }));
    return horas;
  }

  //Cargar las horas del día seleccionado
  function cargarHoras(indexDia) {
    setDiaPredHoras(indexDia);
    const fechaDia = prediccionDiaria[indexDia].fecha.split("T")[0];

    //Buscar ese día en la predicción horaria completa
    const diaHoras = prediccionHorasComp.find(d => d.fecha.startsWith(fechaDia));
    
    if(!diaHoras) {
      setPrediccionHoras(null);
      return;
    }

    //Unir los datos por hora
    const datosUnidos = unirDatosHora(diaHoras);
    setPrediccionHoras(datosUnidos);
  }

  /*TABLA HORAS
  La tabla por horas la hago con una función aquí, porque quiero separarla en dos tablas. Esto es porque
  son muchas horas y creo que es más cómodo para el usuario que se separe en dos tablas antes que tener una tabla 
  que sea muy larga. Mantengo que sea horizontal porque personalmente me gusta más como queda.*/
  function tablaHoras(listaHoras) {
    return(
      <table className="tabla-prediccion">
        <tr>
          <td className="encabezado-vacio"></td>
          {listaHoras.map((h, index) => (
            <td key={index} className="hora">{h.hora}:00</td>
          ))}
        </tr>
        <tr>
          <td className="encabezado-vacio"></td>
          {listaHoras.map((h, index) => (
            <td key={index} className="temp-dia">{h.temperatura}ºC</td>
          ))}
        </tr>
        <tr>
          <td className="encabezado-vacio"></td>
          {listaHoras.map((h, index) => (
            <td key={index} className="icono-cielo">
              {iconoDescripcion(h.estadoCielo)}
            </td>
          ))}
        </tr>
        <tr>
          <td className="encabezado">Lluvia</td>
          {listaHoras.map((h, index) => (
            <td key={index}>{h.precipitacion} mm</td>
          ))}
        </tr>
        <tr>
          <td className="encabezado">Viento</td>
          {listaHoras.map((h, index) => (
            <td key={index} className="viento">
              <span>{h.viento.direccion}</span>
              <span>{h.viento.velocidad}km/h</span>
            </td>
          ))}
        </tr>
      </table>
    );
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
                return (<td key={index} className={"fecha"}>{fechaFormateada}</td>);
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
            <tr>
              <td className="encabezado-vacio"></td>
              {prediccionDiaria.map((dia, index) => {
                const fechaDia = dia.fecha.split("T")[0];
                const tieneHoras = Array.isArray(prediccionHorasComp) && prediccionHorasComp.some(d => d.fecha && d.fecha.startsWith(fechaDia));
                return (
                  <td key={index}>
                    {tieneHoras ? (
                      <button onClick={() => cargarHoras(index)}>Ver predicción por horas</button>
                    ) : (<></>)}
                  </td>
                );
              })}
            </tr>
          </table>
        )}
        {/*Predicción por horas*/}
        {diaPredHoras !== null && prediccionHoras && (
          <>
            <h3>Predicción por horas del día {formatearFecha(prediccionDiaria[diaPredHoras].fecha)}</h3>

            {/*Tabla de las 00 hasta las 12*/}
            {tablaHoras(prediccionHoras.slice(0, 12))}
            {/*Tabla resto de horas*/}
            {prediccionHoras.length > 12 && tablaHoras(prediccionHoras.slice(12))}
          </>
        )}
      </div>
    </div>
  );
}

export default App
