# Genera el modelo UML de CiudadanIA en Enterprise Architect (API de automatización COM)
# y exporta cada diagrama como PNG para el informe.
#   Uso:  pwsh -File docs/ea/generar-modelo-ea.ps1
$ErrorActionPreference = "Stop"
$raiz = Resolve-Path "$PSScriptRoot\..\.."
$archivoModelo = Join-Path $raiz "docs\ea\CiudadanIA.qea"
$carpetaImg = Join-Path $raiz "docs\diagramas"
New-Item -ItemType Directory -Force $carpetaImg | Out-Null
if (Test-Path $archivoModelo) { Remove-Item $archivoModelo -Force }

$repo = New-Object -ComObject EA.Repository
if (-not $repo.CreateModel(0, $archivoModelo, 0)) { throw "No se pudo crear $archivoModelo" }
$null = $repo.OpenFile($archivoModelo)
$proyecto = $repo.GetProjectInterface()

# ---------- utilidades ----------
function Nuevo-Paquete($padre, $nombre) {
  $p = $padre.Packages.AddNew($nombre, "Package"); $null = $p.Update(); $null = $padre.Packages.Refresh(); return $p
}
function Nuevo-Elemento($paquete, $nombre, $tipo, $estereotipo = "", $nota = "") {
  $e = $paquete.Elements.AddNew($nombre, $tipo)
  if ($estereotipo) { $e.Stereotype = $estereotipo }
  if ($nota) { $e.Notes = $nota }
  $null = $e.Update(); return $e
}
function Conectar($origen, $destino, $tipo, $estereotipo = "", $multOrigen = "", $multDestino = "", $agregacionDestino = 0, $nombre = "") {
  $c = $origen.Connectors.AddNew($nombre, $tipo)
  $c.SupplierID = $destino.ElementID
  if ($estereotipo) { $c.Stereotype = $estereotipo }
  if ($multOrigen) { $c.ClientEnd.Cardinality = $multOrigen }
  if ($multDestino) { $c.SupplierEnd.Cardinality = $multDestino }
  if ($agregacionDestino) { $c.SupplierEnd.Aggregation = $agregacionDestino }
  $null = $c.Update(); return $c
}
function Nuevo-Diagrama($paquete, $nombre, $tipo) {
  $d = $paquete.Diagrams.AddNew($nombre, $tipo); $null = $d.Update(); return $d
}
function Colocar($diagrama, $elemento, $x, $y, $ancho, $alto) {
  $o = $diagrama.DiagramObjects.AddNew("l=$x;r=$($x+$ancho);t=$y;b=$($y+$alto);", "")
  $o.ElementID = $elemento.ElementID; $null = $o.Update(); return $o
}
function Exportar($diagrama, $archivo) {
  $null = $repo.ReloadDiagram($diagrama.DiagramID)
  $null = $proyecto.PutDiagramImageToFile($diagrama.DiagramGUID, (Join-Path $carpetaImg $archivo), 1)
  Write-Host "  ✓ $archivo"
}
function Atributo($clase, $nombre, $tipo, $visibilidad = "Private", $estereotipo = "") {
  $a = $clase.Attributes.AddNew($nombre, $tipo); $a.Visibility = $visibilidad
  if ($estereotipo) { $a.Stereotype = $estereotipo }
  $null = $a.Update()
}
function Metodo($clase, $nombre, $retorno, $parametros = @()) {
  $m = $clase.Methods.AddNew($nombre, $retorno); $m.Visibility = "Public"; $null = $m.Update()
  foreach ($p in $parametros) { $pa = $m.Parameters.AddNew($p[0], $p[1]); $null = $pa.Update() }
  $null = $m.Update()
}

# ---------- estructura de paquetes ----------
$modelo = $repo.Models.AddNew("CiudadanIA", ""); $null = $modelo.Update(); $null = $repo.Models.Refresh()
$pReq  = Nuevo-Paquete $modelo "1. Requisitos funcionales"
$pCU   = Nuevo-Paquete $modelo "2. Casos de uso - Gestión de Formularios"
$pCls  = Nuevo-Paquete $modelo "3. Modelo de dominio (clases)"
$pMVC  = Nuevo-Paquete $modelo "4. Arquitectura MVC"

# ---------- requisitos (para trazabilidad) ----------
$rfTextos = [ordered]@{
  RF01 = "Registrar portafolio"; RF02 = "Consultar portafolios"; RF03 = "Modificar portafolio"; RF04 = "Eliminar portafolio"
  RF05 = "Registrar formulario"; RF06 = "Consultar formularios"; RF07 = "Modificar formulario"; RF08 = "Eliminar formulario"
  RF09 = "Cambiar estado del formulario"; RF10 = "Agregar pregunta"; RF11 = "Modificar pregunta"; RF12 = "Eliminar pregunta"
}
$RF = @{}
foreach ($k in $rfTextos.Keys) { $RF[$k] = Nuevo-Elemento $pReq "$k $($rfTextos[$k])" "Requirement" }

# ---------- actor ----------
$investigador = Nuevo-Elemento $pCU "Investigador" "Actor" "" "Investigador de la UTPL. Único rol autorizado para crear, modificar y eliminar (RNF02)."

$W = 190; $H = 70   # tamaño de los casos de uso

# ===== Diagrama 1: Casos de uso GENERAL =====
$cuP = Nuevo-Elemento $pCU "CU01 Gestionar portafolios (RF01-RF04)" "UseCase"
$cuF = Nuevo-Elemento $pCU "CU02 Gestionar formularios (RF05-RF09)" "UseCase"
$cuQ = Nuevo-Elemento $pCU "CU03 Gestionar preguntas (RF10-RF12)" "UseCase"
$cuI = Nuevo-Elemento $pCU "CU04 Cambiar idioma (RNF01)" "UseCase"
$limG = Nuevo-Elemento $pCU "CiudadanIA - Módulo Gestión de Formularios" "Boundary"
foreach ($cu in @($cuP, $cuF, $cuQ, $cuI)) { $null = Conectar $investigador $cu "Association" }
$null = Conectar $cuQ $cuF "Dependency" "include"
$null = Conectar $cuF $cuP "Dependency" "include"

$dG = Nuevo-Diagrama $pCU "CU General - Gestión de Formularios" "Use Case"
$null = Colocar $dG $limG 200 30 560 470
$null = Colocar $dG $investigador 60 230 50 90
$null = Colocar $dG $cuP 260 80 $W $H
$null = Colocar $dG $cuF 260 210 $W $H
$null = Colocar $dG $cuQ 260 340 $W $H
$null = Colocar $dG $cuI 520 210 $W $H

# ===== Diagrama 2: CU específico PORTAFOLIOS =====
$c11 = Nuevo-Elemento $pCU "CU01.1 Registrar portafolio [RF01]" "UseCase"
$c12 = Nuevo-Elemento $pCU "CU01.2 Consultar portafolios [RF02]" "UseCase"
$c13 = Nuevo-Elemento $pCU "CU01.3 Modificar portafolio [RF03]" "UseCase"
$c14 = Nuevo-Elemento $pCU "CU01.4 Eliminar portafolio [RF04]" "UseCase"
$vNom = Nuevo-Elemento $pCU "Validar nombre obligatorio y único" "UseCase"
$bus  = Nuevo-Elemento $pCU "Buscar portafolio por nombre" "UseCase"
$conf = Nuevo-Elemento $pCU "Confirmar eliminación" "UseCase"
$vSin = Nuevo-Elemento $pCU "Verificar que no tenga formularios" "UseCase"
foreach ($cu in @($c11, $c12, $c13, $c14)) { $null = Conectar $investigador $cu "Association" }
$null = Conectar $c11 $vNom "Dependency" "include"
$null = Conectar $c13 $vNom "Dependency" "include"
$null = Conectar $bus $c12 "Dependency" "extend"
$null = Conectar $c14 $conf "Dependency" "include"
$null = Conectar $c14 $vSin "Dependency" "include"
$lim1 = Nuevo-Elemento $pCU "Gestionar portafolios" "Boundary"

$d1 = Nuevo-Diagrama $pCU "CU Específico 1 - Gestionar portafolios" "Use Case"
$null = Colocar $d1 $lim1 200 20 620 520
$null = Colocar $d1 $investigador 60 240 50 90
$null = Colocar $d1 $c11 240 180 $W $H
$null = Colocar $d1 $c12 240 60 $W $H
$null = Colocar $d1 $c13 240 300 $W $H
$null = Colocar $d1 $c14 240 420 $W $H
$null = Colocar $d1 $vNom 580 240 $W $H
$null = Colocar $d1 $bus 580 60 $W $H
$null = Colocar $d1 $conf 580 360 $W $H
$null = Colocar $d1 $vSin 580 465 $W $H

# ===== Diagrama 3: CU específico FORMULARIOS =====
$c21 = Nuevo-Elemento $pCU "CU02.1 Registrar formulario [RF05]" "UseCase"
$c22 = Nuevo-Elemento $pCU "CU02.2 Consultar formularios [RF06]" "UseCase"
$c23 = Nuevo-Elemento $pCU "CU02.3 Modificar formulario [RF07]" "UseCase"
$c24 = Nuevo-Elemento $pCU "CU02.4 Eliminar formulario [RF08]" "UseCase"
$c25 = Nuevo-Elemento $pCU "CU02.5 Cambiar estado del formulario [RF09]" "UseCase"
$filt = Nuevo-Elemento $pCU "Filtrar por estado" "UseCase"
$det  = Nuevo-Elemento $pCU "Ver detalle con preguntas en orden" "UseCase"
$cerr = Nuevo-Elemento $pCU "Cerrar formulario con reportes" "UseCase"
$vPre = Nuevo-Elemento $pCU "Validar al menos 1 pregunta" "UseCase"
$vDat = Nuevo-Elemento $pCU "Validar título, descripción y consentimiento" "UseCase"
foreach ($cu in @($c21, $c22, $c23, $c24, $c25)) { $null = Conectar $investigador $cu "Association" }
$null = Conectar $c21 $vDat "Dependency" "include"
$null = Conectar $c23 $vDat "Dependency" "include"
$null = Conectar $filt $c22 "Dependency" "extend"
$null = Conectar $det $c22 "Dependency" "extend"
$null = Conectar $cerr $c24 "Dependency" "extend"
$null = Conectar $c25 $vPre "Dependency" "include"
$lim2 = Nuevo-Elemento $pCU "Gestionar formularios" "Boundary"

$d2 = Nuevo-Diagrama $pCU "CU Específico 2 - Gestionar formularios" "Use Case"
$null = Colocar $d2 $lim2 200 20 640 640
$null = Colocar $d2 $investigador 60 300 50 90
$null = Colocar $d2 $c21 240 180 $W $H
$null = Colocar $d2 $c22 240 60 $W $H
$null = Colocar $d2 $c23 240 300 $W $H
$null = Colocar $d2 $c24 240 420 $W $H
$null = Colocar $d2 $c25 240 540 $W $H
$null = Colocar $d2 $vDat 600 240 $W $H
$null = Colocar $d2 $filt 600 30 $W $H
$null = Colocar $d2 $det 600 130 $W $H
$null = Colocar $d2 $cerr 600 420 $W $H
$null = Colocar $d2 $vPre 600 540 $W $H

# ===== Diagrama 4: CU específico PREGUNTAS =====
$c31 = Nuevo-Elemento $pCU "CU03.1 Agregar pregunta [RF10]" "UseCase"
$c32 = Nuevo-Elemento $pCU "CU03.2 Modificar pregunta [RF11]" "UseCase"
$c33 = Nuevo-Elemento $pCU "CU03.3 Eliminar pregunta [RF12]" "UseCase"
$vBor = Nuevo-Elemento $pCU "Verificar formulario en Borrador" "UseCase"
$opc  = Nuevo-Elemento $pCU "Registrar opciones (mínimo 2)" "UseCase"
$reo  = Nuevo-Elemento $pCU "Reordenar preguntas" "UseCase"
$cnf2 = Nuevo-Elemento $pCU "Confirmar eliminación de pregunta" "UseCase"
foreach ($cu in @($c31, $c32, $c33)) { $null = Conectar $investigador $cu "Association"; $null = Conectar $cu $vBor "Dependency" "include" }
$null = Conectar $opc $c31 "Dependency" "extend"
$null = Conectar $opc $c32 "Dependency" "extend"
$null = Conectar $c33 $reo "Dependency" "include"
$null = Conectar $c33 $cnf2 "Dependency" "include"
$lim3 = Nuevo-Elemento $pCU "Gestionar preguntas" "Boundary"

$d3 = Nuevo-Diagrama $pCU "CU Específico 3 - Gestionar preguntas" "Use Case"
$null = Colocar $d3 $lim3 200 20 640 520
$null = Colocar $d3 $investigador 60 200 50 90
$null = Colocar $d3 $c31 240 40 $W $H
$null = Colocar $d3 $c32 240 260 $W $H
$null = Colocar $d3 $c33 240 380 $W $H
$null = Colocar $d3 $opc 300 150 170 $H
$null = Colocar $d3 $vBor 600 150 $W $H
$null = Colocar $d3 $reo 600 330 $W $H
$null = Colocar $d3 $cnf2 600 440 $W $H

# ===== Diagrama 5: Trazabilidad CU -> RF =====
$traza = @(
  @($c11, "RF01"), @($c12, "RF02"), @($c13, "RF03"), @($c14, "RF04"),
  @($c21, "RF05"), @($c22, "RF06"), @($c23, "RF07"), @($c24, "RF08"), @($c25, "RF09"),
  @($c31, "RF10"), @($c32, "RF11"), @($c33, "RF12")
)
$dT = Nuevo-Diagrama $pReq "Trazabilidad casos de uso - requisitos" "Requirements"
$i = 0
foreach ($par in $traza) {
  $null = Conectar $par[0] $RF[$par[1]] "Realisation" "trace"
  $y = 20 + $i * 75
  $null = Colocar $dT $par[0] 40 $y 230 60
  $null = Colocar $dT $RF[$par[1]] 420 $y 230 60
  $i++
}

# ===== Diagrama 6: Clases (desde tarjetas CRC) =====
$eEst = Nuevo-Elemento $pCls "EstadoFormulario" "Enumeration"
foreach ($v in "BORRADOR", "PUBLICADO", "CERRADO") { Atributo $eEst $v "" "Public" "enum" }
$eTip = Nuevo-Elemento $pCls "TipoPregunta" "Enumeration"
foreach ($v in "OPCION_MULTIPLE", "TEXTO", "SI_NO", "UBICACION_GPS", "IMAGEN") { Atributo $eTip $v "" "Public" "enum" }
$eRol = Nuevo-Elemento $pCls "Rol" "Enumeration"
foreach ($v in "INVESTIGADOR", "PARTICIPANTE", "REVISOR", "ADMINISTRADOR") { Atributo $eRol $v "" "Public" "enum" }

$kUsu = Nuevo-Elemento $pCls "Usuario" "Class"
Atributo $kUsu "id" "String"; Atributo $kUsu "nombre" "String"; Atributo $kUsu "correo" "String"; Atributo $kUsu "rol" "Rol"
Metodo $kUsu "esInvestigador" "Boolean"

$kPor = Nuevo-Elemento $pCls "Portafolio" "Class"
Atributo $kPor "id" "String"; Atributo $kPor "nombre" "String"; Atributo $kPor "descripcion" "String"; Atributo $kPor "fechaCreacion" "Date"
Metodo $kPor "crear" "Portafolio" @(,@("datos", "DatosPortafolio"))
Metodo $kPor "agregarFormulario" "void" @(,@("f", "Formulario"))
Metodo $kPor "quitarFormulario" "void" @(,@("id", "String"))
Metodo $kPor "listarFormularios" "Formulario[]"
Metodo $kPor "validar" "void" @(,@("nombreYaExiste", "Boolean"))
Metodo $kPor "puedeEliminarse" "Boolean"

$kFor = Nuevo-Elemento $pCls "Formulario" "Class"
Atributo $kFor "id" "String"; Atributo $kFor "titulo" "String"; Atributo $kFor "descripcion" "String"
Atributo $kFor "consentimiento" "String"; Atributo $kFor "estado" "EstadoFormulario"; Atributo $kFor "totalReportes" "Integer"
Metodo $kFor "agregarPregunta" "Pregunta" @(,@("datos", "DatosPregunta"))
Metodo $kFor "modificarPregunta" "Pregunta" @(@("id", "String"), @("datos", "DatosPregunta"))
Metodo $kFor "quitarPregunta" "void" @(,@("id", "String"))
Metodo $kFor "ordenarPreguntas" "void"
Metodo $kFor "publicar" "void"
Metodo $kFor "cerrar" "void"
Metodo $kFor "esEditable" "Boolean"
Metodo $kFor "solicitarEliminacion" "ResultadoEliminacion"
Metodo $kFor "validar" "void"

$kPre = Nuevo-Elemento $pCls "Pregunta" "Class"
Atributo $kPre "id" "String"; Atributo $kPre "enunciado" "String"; Atributo $kPre "tipo" "TipoPregunta"
Atributo $kPre "orden" "Integer"; Atributo $kPre "obligatoria" "Boolean"
Metodo $kPre "agregarOpcion" "Opcion" @(,@("texto", "String"))
Metodo $kPre "quitarOpcion" "void" @(,@("orden", "Integer"))
Metodo $kPre "esOpcionMultiple" "Boolean"
Metodo $kPre "validar" "void"

$kOpc = Nuevo-Elemento $pCls "Opcion" "Class"
Atributo $kOpc "id" "String"; Atributo $kOpc "texto" "String"; Atributo $kOpc "orden" "Integer"
Metodo $kOpc "validar" "void"

$null = Conectar $kPor $kUsu "Association" "" "0..*" "1" 0 "creado por"
$null = Conectar $kFor $kPor "Association" "" "0..*" "1" 2 ""
$null = Conectar $kPre $kFor "Association" "" "1..*" "1" 2 ""
$null = Conectar $kOpc $kPre "Association" "" "0..*" "1" 2 ""
$null = Conectar $kFor $eEst "Dependency" "use"
$null = Conectar $kPre $eTip "Dependency" "use"
$null = Conectar $kUsu $eRol "Dependency" "use"

$dC = Nuevo-Diagrama $pCls "Diagrama de clases - Gestión de Formularios" "Logical"
$null = Colocar $dC $kUsu 30 40 220 120
$null = Colocar $dC $eRol 30 260 180 120
$null = Colocar $dC $kPor 330 30 260 190
$null = Colocar $dC $kFor 330 300 300 280
$null = Colocar $dC $eEst 700 330 180 100
$null = Colocar $dC $kPre 330 660 260 190
$null = Colocar $dC $eTip 700 690 190 130
$null = Colocar $dC $kOpc 30 690 200 110

# ===== Diagrama 7: Arquitectura MVC =====
$vP = Nuevo-Elemento $pMVC "Vistas: páginas /[locale]/portafolios, formularios, preguntas" "Class" "view"
$vC = Nuevo-Elemento $pMVC "Componentes: FormPortafolio, FormFormulario, FormPregunta, BotonConfirmar" "Class" "view"
$vI = Nuevo-Elemento $pMVC "Recursos i18n: es.json / en.json" "Artifact"
$ctP = Nuevo-Elemento $pMVC "PortafolioController" "Class" "controller"
$ctF = Nuevo-Elemento $pMVC "FormularioController" "Class" "controller"
$ctQ = Nuevo-Elemento $pMVC "PreguntaController" "Class" "controller"
$ctB = Nuevo-Elemento $pMVC "ejecutarAccion() - verifica rol, captura errores" "Class" "controller"
$sP = Nuevo-Elemento $pMVC "PortafolioService" "Class" "model"
$sF = Nuevo-Elemento $pMVC "FormularioService" "Class" "model"
$sQ = Nuevo-Elemento $pMVC "PreguntaService" "Class" "model"
$dom = Nuevo-Elemento $pMVC "Dominio: Portafolio, Formulario, Pregunta, Opcion, Usuario" "Class" "model"
$rep = Nuevo-Elemento $pMVC "Repositorios Prisma" "Class" "model"
$bd = Nuevo-Elemento $pMVC "PostgreSQL (Neon)" "Node" "database"
$null = Conectar $vP $vC "Dependency" "use"
$null = Conectar $vC $vI "Dependency" "use"
foreach ($c in @($ctP, $ctF, $ctQ)) { $null = Conectar $vC $c "Dependency" "invoca"; $null = Conectar $c $ctB "Dependency" "use" }
$null = Conectar $ctP $sP "Dependency" "use"; $null = Conectar $ctF $sF "Dependency" "use"; $null = Conectar $ctQ $sQ "Dependency" "use"
foreach ($s in @($sP, $sF, $sQ)) { $null = Conectar $s $dom "Dependency" "use"; $null = Conectar $s $rep "Dependency" "use" }
$null = Conectar $rep $bd "Dependency" "SQL"

$dM = Nuevo-Diagrama $pMVC "Arquitectura MVC - CiudadanIA" "Logical"
$null = Colocar $dM $vP 40 30 300 70
$null = Colocar $dM $vC 380 30 330 70
$null = Colocar $dM $vI 760 30 200 70
$null = Colocar $dM $ctP 80 190 220 60
$null = Colocar $dM $ctF 360 190 220 60
$null = Colocar $dM $ctQ 640 190 220 60
$null = Colocar $dM $ctB 360 300 260 60
$null = Colocar $dM $sP 80 430 220 60
$null = Colocar $dM $sF 360 430 220 60
$null = Colocar $dM $sQ 640 430 220 60
$null = Colocar $dM $dom 120 560 330 60
$null = Colocar $dM $rep 540 560 220 60
$null = Colocar $dM $bd 560 680 180 80

$null = $repo.RefreshModelView(0)

Write-Host "Exportando diagramas:"
Exportar $dG "01-cu-general.png"
Exportar $d1 "02-cu-portafolios.png"
Exportar $d2 "03-cu-formularios.png"
Exportar $d3 "04-cu-preguntas.png"
Exportar $dT "05-trazabilidad-cu-rf.png"
Exportar $dC "06-diagrama-clases.png"
Exportar $dM "07-arquitectura-mvc.png"

$repo.CloseFile(); $repo.Exit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($repo) | Out-Null
Write-Host "Modelo guardado en $archivoModelo"
