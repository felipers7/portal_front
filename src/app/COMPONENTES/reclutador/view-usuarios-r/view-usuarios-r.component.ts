import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { UsuarioService } from 'src/app/service/usuario.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator} from '@angular/material/paginator';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatSort, Sort} from '@angular/material/sort';
import { Usuario } from 'src/app/interface/user.interface';
import { HerramientaData } from 'src/app/interface/herramienta-data.interface';
import { CategoriaProducto } from 'src/app/interface/categoria-prod.interface';
import { CategoriaProductoService } from 'src/app/service/categoria-producto.service';
import { ProductoService } from 'src/app/service/producto.service';
import { Producto } from 'src/app/interface/producto.interface';
import { VersionProducto } from 'src/app/interface/version.interface';

import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ViewPerfilUsuarioRComponent } from '../view-perfil-usuario-r/view-perfil-usuario-r.component';
import { LaboralService } from 'src/app/service/laboral.service';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { viewCrudArchivoComponent } from '../view-crudarchivo/view-crudarchivo.component';
import * as Papa from 'papaparse';
import { PreguntaService } from 'src/app/service/pregunta.service';
import { ObservacionService } from 'src/app/service/observacionreclutador.service';
import { forkJoin } from 'rxjs';

import { CargosElitsoft } from 'src/app/interface/cargos-elitsoft.interface';
import { CargosElitsoftService } from 'src/app/service/cargos-elitsoft.service';
import { EmailRService } from 'src/app/service/email-r.service';


const ELEMENT_DATA: Usuario[] = [];

@Component({
  selector: 'app-view-usuarios-r',
  templateUrl: './view-usuarios-r.component.html',
  styleUrls: ['./view-usuarios-r.component.css'],
})

export class ViewUsuariosRComponent implements OnInit, AfterViewInit {
  displayedColumns: any[] = ['usr_nom', 'usr_tel', 'usr_email', 'seleccionar', 'motivo', 'acciones',];
  dataSource = new MatTableDataSource(ELEMENT_DATA);
  resultados  = [];
  idUser: string = '';
  filtro: string = '';
  filtroPuntaje: string = '';
  originalDataCopy: Usuario[] = [];
  usuarios: Usuario[] = [];
  categorias: CategoriaProducto[] = [];
  cargos: CargosElitsoft[] = [];
  productos: Producto[] = [];
  versiones: VersionProducto[] = [];
  selectedAniosExpRange: number[] = [1, 10];
  isIrrelevant: boolean = true;
  selectedSueldoRange: number[] = [1, 10000000];
  selectedCategoria: number = 0;
  selectedCargo: number = 0;
  selectedProducto: number = 0;
  selectedVersion: number = 0;
  selectedAniosExp: number = 0;
  selectedProductoNombre: string | undefined = "";
  inputContent: boolean = false;
  lastYears: number = 0;
  selectedEstado: string = '';
  filterCargo: string = '';
  selectedProductos: number[] = [];
  fechaPostulacionDesde: Date | null = null;
  fechaPostulacionHasta: Date | null = null;

  motivosSeleccionados: Map<string, string> = new Map();
  motivos: string[] = ['Solicitud de datos', 'Contactar', 'Invitar a nueva postulación', 'Informar resultados'];
  seleccionarTodos = false;



  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private usuarioService: UsuarioService,
    private observacionReclutadorService: ObservacionService,
    private preguntaService:PreguntaService,
    private _liveAnnouncer: LiveAnnouncer,
    private router: Router,
    private categoriaProductoService: CategoriaProductoService,
    private cargosElitsoftService: CargosElitsoftService,
    private productoService: ProductoService,
    public dialog: MatDialog,
    private _bottomSheet: MatBottomSheet,
    private emailRService: EmailRService,

  ) {}


  ngOnInit(): void {
    this.obtenerUsuarios();
    this.getCategories();
    this.obtenerResultadosByUser(); // Agrega los paréntesis para llamar a la función
    this.getCargosElitsoft();
  }


  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  filterData() {
    let filteredArray = this.originalDataCopy;

    // Filtro por productos seleccionados
    if (this.selectedProductos.length > 0) {
      filteredArray = filteredArray.filter(usuario => {
        const herramientasArray = usuario.usr_herr.split(', ');

        // Comprobamos que todas las herramientas seleccionadas estén en la lista de herramientas del usuario
        // El usuario pasara el filtro siempre y cuando tenga todas los productos que se han seleccionados
        return this.selectedProductos.every(selectedProductoId => {
          const producto = this.productos.find(p => p.prd_id === selectedProductoId);
          return producto && herramientasArray.includes(producto.prd_nom);
        });
      });
    }

    // Filtro por versión
    if (this.selectedVersion > 0) {
      const selectedVersion = this.versiones.find(version => version.vrs_id === this.selectedVersion);
      if (selectedVersion) {
        filteredArray = filteredArray.filter(element => element.herr_ver.includes(selectedVersion.vrs_name));
      }
    }



// Filtro por resultado del usuario
  if (this.resultados !== undefined) {
  this.preguntaService.obtenerResultadosByUser(this.idUser).subscribe(
    (resultadoUsuario) => {
      console.log('Resultado obtenido del servicio:', resultadoUsuario);
      console.log('Resultados actuales en el componente:', this.resultados);

      filteredArray = filteredArray.filter(usuario => {
        // Usar una función de flecha para preservar el contexto
        return resultadoUsuario === this.resultados;
      });

      console.log('Array filtrado:', filteredArray);
    },
    (error) => {
      console.error('Error al obtener resultados del usuario: ', error);
    }
  );
}


    // Filtro por rango de sueldos
    const [minSueldo, maxSueldo] = this.selectedSueldoRange;
    filteredArray = filteredArray.filter(usuario => {
      return usuario.cargoUsuario && usuario.cargoUsuario.some(cargo => {
        const sueldo = cargo.crg_usr_pret; // Asume que 'crg_usr_pret' es el sueldo pretendido por el usuario
        return sueldo >= minSueldo && sueldo <= maxSueldo;
      });
    });

    // Filtro por cargo
    if (this.selectedCargo > 0) {
      filteredArray = filteredArray.filter(usuario => {
        return usuario.cargoUsuario && usuario.cargoUsuario.some(cargo => cargo.cargoElitsoft && cargo.cargoElitsoft.crg_elit_id === this.selectedCargo);
      });
    }

    // Filtro por estado
    if (this.selectedEstado && this.selectedEstado !== '') {
      filteredArray = filteredArray.filter((usuario) => {
        return usuario.cargoUsuario && usuario.cargoUsuario.some((estado) => estado.disponibilidad === this.selectedEstado);
      });
    }

    // Filtro por ultimos años de experiencia
    if (this.lastYears) {
      filteredArray = filteredArray.filter((usuario) => {
        return usuario.laborales?.some((experiencia) => {
          return experiencia.herramientas?.some((herramienta: any) => {
            const herramientaExperiencia = herramienta.versionProducto?.prd?.prd_id;
            if (herramientaExperiencia && herramientaExperiencia === this.selectedProducto) {
              const fechaFin = new Date(experiencia.inf_lab_fec_fin);
              const currentYear = new Date().getFullYear();
              return fechaFin.getFullYear() >= currentYear - this.lastYears;
            }
            return false;
          });
        });
      });
    }

    // Filtro por rango de años de experiencia solo si se ha seleccionado una versión
    if (this.selectedVersion > 0) {
      const [min, max] = this.selectedAniosExpRange; // Desestructuramos el arreglo 'selectedAniosExpRange' en las variables 'min' y 'max'
      filteredArray = filteredArray.filter(element => {
        const anosExp = element.herr_exp.split(', ').map(Number); // Dividimos la propiedad 'herr_exp' en un array de numeros
        return anosExp.some(anos => anos >= min && anos <= max); // Verificamos si alguno de los numeros en el arreglo 'anosExp' se encuentra dentro del rango seleccionado
      });
    }

    console.log('Filtro de años de experiencia:', this.selectedAniosExpRange);
    console.log('Usuarios filtrados:', filteredArray);

    this.dataSource.data = filteredArray;
  }

  getCargosElitsoft() {
    this.cargosElitsoftService.obtenerListaCargosElitsoft().subscribe(
      (data: CargosElitsoft[]) => {
        this.cargos = data;
      }
    )
  }

  onIrrelevanceChange() {
    if (this.isIrrelevant) {
      this.lastYears = 0;
    }

    this.filterData();
  }

  onLast5YearsChange() {
    // Llamar a filterData cuando cambie el valor de this.lastYears
    this.filterData();
  }

  filterInput() {
    let filteredArray = this.originalDataCopy;

    if (this.filtro) {
      const filtroLowerCase = this.filtro.toLowerCase();
      filteredArray = filteredArray.filter(element => {
        if (element.usr_nom) {
          return element.usr_nom.toLowerCase().includes(filtroLowerCase);
        }
        return false;
      });
    }

    this.dataSource.data = filteredArray;
  }

  filterByCargo() {
    let filteredArray = this.originalDataCopy;

    if (this.filterCargo) {
      const filtroCargoLowerCase = this.filterCargo.toLowerCase();
      filteredArray = filteredArray.filter(usuario =>
        usuario.cargoUsuario?.some(cargo =>
          cargo.crg_prf && cargo.crg_prf.toLowerCase().includes(filtroCargoLowerCase)
        )
      );
    }

    this.dataSource.data = filteredArray;
    console.log('Usuarios filtrados', filteredArray);
  }

  formatLabel(value: number): string {
    if (value >= 1000) {
      return Math.round(value / 1000) + 'k';
    }

    return `${value}`;
  }

  filterProducto() {
    this.filterData();
  }


  filterPuntaje() {
    this.filtroPuntaje = `Filtrado por puntaje: ${this.filtroPuntaje}`;
    this.filterData();
  }

  filterVersion() {
    if (this.selectedVersion === 0) {
      this.selectedAniosExpRange = [1, 10];
    }

    this.filterData();
  }

  filterAniosExp() {
    this.filterData();
  }

  obtenerUsuarios(): void {
    this.usuarioService.obtenerUsuarios().subscribe(
      (data: any[]) => {
        console.log('data:', data);
        const usuarios = data.map((usuario) => ({
          usr_nom: usuario.usr_nom + " " +usuario.usr_ap_pat + " "+ usuario.usr_ap_mat || '',
          usr_tel: usuario.usr_tel || '',
          usr_email: usuario.usr_email || '',
          usr_direcc:usuario.usr_direcc || '',
          usr_herr: usuario.herramientas
            .filter((herramienta: HerramientaData) => herramienta.versionProducto && herramienta.versionProducto.prd)
            .map((herramienta: HerramientaData) => herramienta.versionProducto.prd.prd_nom)
            .join(', '),
          herr_ver: usuario.herramientas
            .filter((herramienta: HerramientaData) => herramienta.versionProducto && herramienta.versionProducto.vrs_name)
            .map((herramienta: HerramientaData) => herramienta.versionProducto.vrs_name)
            .join(', '),
          herr_exp: usuario.herramientas
            .filter((herramienta: HerramientaData) => herramienta.versionProducto && herramienta.versionProducto.prd)
            .map((herramienta: HerramientaData) => herramienta.herr_usr_anos_exp)
            .join(', '),
          laborales: usuario.laborales,
          usr_id: usuario.usr_id,
          cvPath: usuario.cvPath,
          cargoUsuario: usuario.cargoUsuario,
          seleccionado: !!usuario.seleccionado as boolean,
        }));

        this.originalDataCopy = usuarios;
        this.dataSource.data = usuarios;
      },
      (error) => {
        console.log(error);
      }
    );
  }


  exportToCSV() {
    const dataToExport = this.dataSource.data;
    const csv = Papa.unparse(dataToExport);

    // Crear un enlace de descarga para el archivo CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'usuarios.csv'; // Nombre del archivo CSV
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }



  getCategories() {
    this.categoriaProductoService.getCategoriasDisponibles().subscribe(
      (data: CategoriaProducto[]) => {
        this.categorias = data;
      },
      () => {
        console.log('Error al obtener categorías:');
      }
    );
  }


  obtenerYFiltrarResultados() {
    console.log('Llamando a obtenerResultadosByUser para el usuario con ID:', this.idUser);

    this.preguntaService.obtenerResultadosByUser(this.idUser).subscribe(
      (resultadoUsuario) => {
        console.log('Resultado obtenido del servicio para el usuario:', resultadoUsuario);

        // Aquí puedes verificar si los datos recibidos son lo que esperas
        this.dataSource.data = this.originalDataCopy.filter(usuario => {
          // Añadir un console.log dentro del filtro para ver qué está pasando
          const esIgual = this.resultados === resultadoUsuario;
          console.log('Comparando resultados - Usuario:', usuario, '¿Es igual?:', esIgual);

          return esIgual;
        });

        // Mostrar los datos filtrados
        console.log('Datos después de aplicar el filtro:', this.dataSource.data);
      },
      (error) => {
        console.error('Error al obtener resultados del usuario: ', error);
      }
    );
  }


  obtenerResultadosByUser() {
    this.preguntaService.obtenerResultadosByUser(this.idUser).subscribe(
      (data: any) => {
        this.resultados = data;
        console.log('Resultados obtenidos:', this.resultados);
      },
      (error) => {
        console.error('Error al obtener resultados:', error);
      }
    );
  }



  getProductos(categoriaId: number){
    console.log('categoria id:', categoriaId)

    this.selectedProducto = 0;
    this.selectedVersion = 0;
    this.selectedProductoNombre = '';
    this.filterInput();
    if (categoriaId) {
      this.productoService.obtenerProductosPorCategoria(categoriaId).subscribe(
        (productos: Producto[]) => {
          this.productos = productos;
          this.selectedProducto = 0;
          this.versiones = [];
          this.originalDataCopy = this.dataSource.data;
          this.filterProducto();
          this.selectedProductoNombre = this.productos.find((producto) => producto.prd_id === this.selectedProducto)?.prd_nom;
          this.getVersion(this.selectedProducto);
        },
        (error) => {
          console.log('Error al cargar productos ', error);
        }
      );
    } else {
      this.selectedProducto = 0;
      this.versiones = [];
      this.productos = [];
      this.selectedProductoNombre = '';
      this.originalDataCopy = this.dataSource.data;
      this.filterProducto();
    }
  }


    getVersion(productoId: number) {
      if (productoId) {
        this.productoService.getVersionByProduct(productoId).subscribe(
          (data: VersionProducto[]) => {
            this.versiones = data;
            // this.filter(new Event('input'));
          },
          (error) => {
            console.log('Error al cargar version ', error);
          }
        );
      }
    }

  announceSortChange(sortState: Sort) {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }
  botonEstadistica(event: any){
    event.preventDefault()
    const elementId = event.target.parentElement.id
    console.log('Element ID:', elementId);

  this.router.navigate([
    "reclutador/estadisticas"

  ])


  }
 openUserProfile(event: any) {
  const userId = event.currentTarget.id; // Obtén el ID del usuario desde el evento
  console.log('User ID:', userId); // Imprime el ID del usuario en la consola

  // Llamadas simultáneas a los servicios
  forkJoin({
    observadores: this.observacionReclutadorService.obtenerObservacionesPorUsuarioId(userId),
    usuario: this.usuarioService.getUsuarioId(userId)
  }).subscribe({
    next: (resultados) => {
      // Extraemos los resultados
      const { observadores, usuario } = resultados;

      // Lógica con los datos obtenidos
      console.log('Observaciones del usuario:', observadores);
      console.log('Perfil del usuario:', usuario);

      // Configura el tamaño del diálogo
      const dialogRef = this.dialog.open(ViewPerfilUsuarioRComponent, {
        data: { userId, observadores, usuario }, // Pasa los datos combinados al componente hijo
        height: '60vh', // Establece la altura del diálogo
      });

      dialogRef.afterClosed().subscribe(result => {
        console.log(`Dialog result: ${result}`);
      });
    },
    error: (error) => {
      console.error('Error al obtener datos del usuario:', error);
      // Manejo de errores aquí
    }
  });
}



  downloadCv(event: any) {
    console.log('usuarioId', event.target?.parentElement)
    const userId = event.target?.parentElement.id
    this.usuarioService.downloadCv(userId).subscribe(
      (data: Blob) => {
        const url = window.URL.createObjectURL(data);
        window.open(url, '_blank');
        // console.log('data:', data);
      },
      (error) => {

      }
    )
  }


  openBottomSheet(): void {
    this._bottomSheet.open(viewCrudArchivoComponent);
  }



  openUserDialog(event: any) {


  }

  enviarCorreosSeleccionados() {
    console.log('Botón Enviar Correos clickeado');
    console.log('Usuarios seleccionados (directamente desde dataSource.data):', this.dataSource.data.filter(usuario => usuario.seleccionado));
    console.log('Motivos seleccionados:', this.motivosSeleccionados);

    // Filtra los usuarios seleccionados directamente desde dataSource.data
    const usuariosSeleccionados = this.dataSource.filteredData.filter(usuario => usuario.seleccionado);

    console.log('Usuarios seleccionados (desde la variable usuarios):', usuariosSeleccionados);

    // Envía correos a los usuarios seleccionados con sus motivos respectivos
    usuariosSeleccionados.forEach(usuario => {
      console.log(`Usuario ${usuario.usr_email} seleccionado: ${usuario.seleccionado}`);
      const motivo = this.motivosSeleccionados.get(usuario.usr_email) || this.motivos[0];

      // Envía el correo al backend
      this.emailRService.enviarCorreo(usuario.usr_email, motivo).subscribe(
        (response) => {
          console.log(`Correo enviado correctamente a ${usuario.usr_email} con motivo: ${motivo}`);
        },
        (error) => {
          console.error(`Error al enviar el correo a ${usuario.usr_email} con motivo: ${motivo}`, error);
        }
      );
    });


}
