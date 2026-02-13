import { useState, useEffect } from 'react'
import './App.css'

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
  const [prediccionHoraria, setPrediccionHoraria] = useState(null);
  const [mostrarHoras, setMostrarHoras] = useState(false);

  //Mensajes de error y cargando
  const [cargando, setCargando] = useState(false);
  const[error, setError] = useState("");

  //Cargar provincias desde provincias.json
  useEffect(() => {
    import("/provincias.json")
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

  //FUNCIÓN AL PULSAR EL BOTÓN ACEPTAR
  const buscarPorNombre = () => {};
  const buscarPorProvincia = () => {};
  return (
    <div className="contenedor">
      <h1 className="titulo">PROYECTO APLICACIÓN DEL TIEMPO</h1>
      <div className="contenedor-busquedas">

        {/*Búsqueda por nombre*/}
        <div className="div-busqueda">
          <h3>Búsqueda manual por municipio</h3>
          <input type="text" placeholder="Introduzca un municipio" value={nombreMunicipio} onChange={(e) => setNombreMunicipio(e.target.value)}/>
          <button onClick={buscarPorNombre}>Aceptar</button>
        </div>

        {/*Separador entre tipos de búsqueda*/}
        <div className="separador"></div>

        {/*Búsqueda con desplegables*/}
        <div className="div-busqueda">
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
          <button onClick={buscarPorProvincia}>Aceptar</button>
        </div>
      </div>
      {/*Mostrar predicción por días*/}
      <div className="contenedor-resultados">
        
      </div>
    </div>
  );
}

export default App
