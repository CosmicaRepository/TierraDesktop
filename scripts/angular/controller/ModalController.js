/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
miAppHome.controller('ModalController', function ($scope, detalleTransferenciaService, transferenciaService, notaCreditoService, detalleNotaCreditoService, $state, ngDialog, $stateParams, _productoService, toaster, facturaService, $timeout, $rootScope, facturaService) {

    $scope._detalleFactura = {
        "idDetalleFactura": null,
        "factura": null,
        "producto": null,
        "cantidadDetalle": null,
        "totalDetalle": null,
        "descuentoDetalle": null,
        "estadoDetalle": true,
        "usuarioCreacion": null,
        "usuarioModificacion": null,
        "fechaCreacion": null,
        "fechaModificacion": null,
        "idStock": null
    };

    $scope._detalleNotaCredito = {
        cantidad: null,
        detalleFactura: null,
        fechaCreacion: null,
        fechaModificacion: null,
        idDetalleNotaCredito: null,
        monto: null,
        notaCredito: null,
        usuarioCreacion: null,
        usuarioModificacion: null
    };

    $scope.detalleTransferencia = {
        idTransferencia: null,
        producto: null,
        idStock: null,
        idSucursal: null,
        cantidad: null
    };

    $scope.toUpdateFactura = "";
    $scope.modalBarcode = "";
    $scope.percent = null;
    $scope.mount = null;

    $scope.buscarModal = function (barcode) {
        $promesa = _productoService.searchByBarcode(barcode);
        $promesa.then(function (datos) {
            toaster.pop({
                type: 'success',
                title: 'Encontrado/s',
                body: 'Se encontraron productos',
                showCloseButton: false
            });
            $rootScope.productosBarcode = datos.data;
        }).catch(function (fallback) {
            toaster.pop({
                type: 'error',
                title: 'Error',
                body: 'No se han encontrado productos',
                showCloseButton: false
            });
        });
    };

    $scope.addDetalleFacturaModal = function () {
        var idFactura = $stateParams.idFactura;
        if ($scope._detalleFactura.cantidadDetalle !== null) {
            var descuento = 0;
            if ($scope.percent !== "") {
                descuento = ($rootScope.productoSelected.precioVenta * $scope.percent) / 100;
            }
            if ($scope.mount !== "") {
                descuento = $scope.mount;
            }
            if ($rootScope.productoSelected.cantidadTotal >= $scope._detalleFactura.cantidadDetalle) {
                $promesa = facturaService.searchById(idFactura);
                $promesa.then(function (datos) {
                    $scope._detalleFactura.factura = datos.data;
                    $scope._detalleFactura.producto = $rootScope.productoSelected;
                    $scope._detalleFactura.descuentoDetalle = descuento;
                    $addDetalle = facturaService.addDetalleFactura($scope._detalleFactura);
                    $addDetalle.then(function (datos) {
                        toaster.pop({
                            type: 'success',
                            title: 'Encontrado/s',
                            body: 'Se ha agregado detalle nuevo.',
                            showCloseButton: false
                        });
                    });
                    $timeout(function timer() {
                        $scope.toUpdateFactura = datos.data;
                        $listDetalles = facturaService.getDetalleFacturaList(idFactura);
                        $listDetalles.then(function (datos) {
                            var totalUpdate = 0;
                            angular.forEach(datos.data, function (value, key) {
                                totalUpdate = parseFloat(totalUpdate) + parseFloat(value.totalDetalle);
                            });
                            $scope.toUpdateFactura.total = totalUpdate;
                            $updateTotal = facturaService.update($scope.toUpdateFactura);
                            $updateTotal.then(function (datos) {
                                $updated = facturaService.searchById(idFactura);
                                $updated.then(function (datos) {
                                    $rootScope.factura = datos.data;
                                });
                            });
                            //                                        $uibModalInstance.close();
                            $rootScope.$emit('ReloadTable', {});
                        });
                    }, 2000);
                });
            } else {
                toaster.pop({
                    type: 'error',
                    title: 'Error',
                    body: 'El stock actual es insuficiente a la cantidad ingresada.',
                    showCloseButton: false
                });
            }
        } else {
            toaster.pop({
                type: 'error',
                title: 'Error',
                body: 'La cantidad no puede estar vacia.',
                showCloseButton: false
            });
        }
    };

    $scope.agregarItem = function (item) {
        ngDialog.open({
            template: 'views/factura/modal-agregar-item.html',
            className: 'ngdialog-theme-sm',
            showClose: false,
            controller: 'ModalController',
            closeByDocument: false,
            closeByEscape: false,
            data: {item: item}
        });
    };

    $scope.confirmarAgregarItem = function (item, cantidad) {
        var idFactura = $stateParams.idFactura;
        if (item.cantidad < cantidad) {
            toaster.pop({
                type: 'warning',
                title: 'Error',
                body: 'El stock actual es insuficiente a la cantidad ingresada.',
                showCloseButton: false
            });
        } else {
            $addDetalle = facturaService.addDetalleFactura(idFactura, item.idProducto.idProducto, item.idStock, cantidad);
            $addDetalle.then(function (datos) {
                if (datos.status === 200) {
                    $updated = facturaService.searchById(idFactura);
                    $updated.then(function (datos) {
                        $rootScope.factura = datos.data;
                        $rootScope.$broadcast('reloadDetalles');
                    });
                    toaster.pop({
                        type: 'success',
                        title: 'Exito',
                        body: 'Se ha agregado un detalle nuevo.',
                        showCloseButton: false
                    });
                    ngDialog.closeAll();
                }
            });
        }
    };

    $scope.confirmarCargarDescuento = function (item) {
        if ($scope.mount === null && $scope.percent === null) {
            toaster.pop({
                type: 'error',
                title: 'Error.',
                body: 'Debes ingresar un valor.',
                showCloseButton: false
            });
        } else {
            ngDialog.open({
                template: 'views/factura/modal-confirmar-cargar-descuento.html',
                className: 'ngdialog-theme-advertencia',
                showClose: false,
                controller: 'ModalController',
                closeByDocument: false,
                closeByEscape: false,
                data: {
                    item: item,
                    mount: $scope.mount,
                    percent: $scope.percent
                }
            });
        }
    };

    $scope.finalizarCargarDescuento = function (obj) {
        var idFactura = $stateParams.idFactura;
        var descuento = 0;
        if (obj.percent !== null) {
            descuento = (obj.item.totalDetalle * obj.percent) / 100;
        } else {
            descuento = obj.mount;
        }
        obj.item.descuentoDetalle = descuento;
        obj.item.totalDetalle = obj.item.totalDetalle - descuento;
        $descuento = facturaService.updateDetalleFactura(obj.item);
        $descuento.then(function (datos) {
            if (datos.status === 200) {
                ngDialog.closeAll();
                $updated = facturaService.searchById(idFactura);
                $updated.then(function (datos) {
                    $rootScope.factura = datos.data;
                    $rootScope.$broadcast('reloadDetalles');
                });
                toaster.pop({
                    type: 'success',
                    title: 'Exito.',
                    body: 'Descuento aplicado con exito.',
                    showCloseButton: false
                });
            } else {
                toaster.pop({
                    type: 'error',
                    title: 'Error.',
                    body: 'Ops algo ha pasado, comunicate con el administrador.',
                    showCloseButton: false
                });
            }
        });
    };

    $scope.finalizarEliminarDescuento = function (detalle, dni, pw) {
        var idFactura = $stateParams.idFactura;
        $discount = facturaService.deleteDiscount(detalle, dni, pw);
        $discount.then(function (datos) {
            if (datos.status === 200) {
                ngDialog.closeAll();
                $updated = facturaService.searchById(idFactura);
                $updated.then(function (datos) {
                    $rootScope.factura = datos.data;
                    $rootScope.$broadcast('reloadDetalles');
                });
                toaster.pop({
                    type: 'success',
                    title: 'Exito.',
                    body: datos.data.msg,
                    showCloseButton: false
                });
            } else {
                toaster.pop({
                    type: 'error',
                    title: 'Error.',
                    body: datos.data.msg,
                    showCloseButton: false
                });
            }
        });
    };

    $scope.finalizarEliminarDetalleFactura = function (obj, dni, pw) {
        var idFactura = $stateParams.idFactura;
        $delete = facturaService.deleteDetalleFactura(obj, dni, pw);
        $delete.then(function (datos) {
            if (datos.status === 200) {
                ngDialog.closeAll();
                $updated = facturaService.searchById(idFactura);
                $updated.then(function (datos) {
                    $rootScope.factura = datos.data;
                    $rootScope.$broadcast('reloadDetalles');
                });
                toaster.pop({
                    type: 'success',
                    title: 'Exito.',
                    body: datos.data.msg,
                    showCloseButton: false
                });
            } else {
                toaster.pop({
                    type: 'error',
                    title: 'Error.',
                    body: datos.data.msg,
                    showCloseButton: false
                });
            }
        });
    };

    $scope.confirarPanelDevolverItem = function (cantidad, detalle) {
        var idNota = $stateParams.idNota;
        if (cantidad > detalle.cantidadDetalle) {
            toaster.pop({
                type: 'error',
                title: '¡Error!',
                body: 'La cantidad supera al detalle.',
                showCloseButton: false
            });
        } else {
            $nota = notaCreditoService.getById(idNota);
            $nota.then(function (datos) {
                if (datos.status === 200) {
                    $scope._detalleNotaCredito.notaCredito = datos.data;
                    $scope._detalleNotaCredito.cantidad = cantidad;
                    $scope._detalleNotaCredito.detalleFactura = detalle;
                    var desc = detalle.descuentoDetalle / detalle.cantidadDetalle;
                    var monto = (detalle.producto.precioVenta * cantidad) - (desc * cantidad);
                    $scope._detalleNotaCredito.monto = monto;
                    $add = detalleNotaCreditoService.add($scope._detalleNotaCredito);
                    $add.then(function (datos) {
                        if (datos.status === 200) {
                            ngDialog.closeAll();
                            toaster.pop({
                                type: 'success',
                                title: '¡Exito!',
                                body: 'Detalle agregado con exito.',
                                showCloseButton: false
                            });
                            $rootScope.$broadcast('updateMontoNota', {});
                            $rootScope.$broadcast('updateDetalleNotaCredito', {});
                        } else {
                            toaster.pop({
                                type: 'error',
                                title: '¡Error!',
                                body: 'Este detalle ya ha sido registrado previamente.',
                                showCloseButton: false
                            });
                        }
                    });
                }
            });
        }
    };

    $scope.confirmarEliminarDetalleNota = function (detalle) {
        $delete = detalleNotaCreditoService.delete(detalle);
        $delete.then(function (datos) {
            if (datos.status === 200) {
                ngDialog.closeAll();
                toaster.pop({
                    type: 'success',
                    title: '¡Exito!',
                    body: 'Detalle eliminado con exito.',
                    showCloseButton: false
                });
                $rootScope.$broadcast('updateDetalleNotaCredito2', {});
                $rootScope.$broadcast('updateMontoNota', {});
            }
        });
    };

    $scope.confirmarModificarDetalleNota = function (detalle) {
        if (detalle.cantidad > detalle.detalleFactura.cantidadDetalle) {
            toaster.pop({
                type: 'error',
                title: '¡Error!',
                body: 'La cantidad supera al detalle.',
                showCloseButton: false
            });
        } else {
            var desc = detalle.detalleFactura.descuentoDetalle / detalle.detalleFactura.cantidadDetalle;
            var monto = (detalle.detalleFactura.producto.precioVenta * detalle.cantidad) - (desc * detalle.cantidad);
            detalle.monto = monto;
            ngDialog.open({
                template: 'views/nota_credito/modal-confirmar-modificar-detalle-nota.html',
                className: 'ngdialog-theme-sm ngdialog-theme-custom',
                showClose: false,
                controller: 'ModalController',
                closeByDocument: false,
                closeByEscape: false,
                data: {detalle: detalle}
            });
        }
    };

    $scope.finalizarModificarDetalleNota = function (detalle) {
        $update = detalleNotaCreditoService.update(detalle);
        $update.then(function (datos) {
            if (datos.status === 200) {
                ngDialog.closeAll();
                toaster.pop({
                    type: 'success',
                    title: '¡Exito!',
                    body: 'Detalle modificado con exito.',
                    showCloseButton: false
                });
                $rootScope.$broadcast('updateDetalleNotaCredito2', {});
                $rootScope.$broadcast('updateMontoNota', {});
            }
        });
    };

    $scope.finalizarNotaCredito = function (cli) {
        var idNota = $stateParams.idNota;
        $nota = notaCreditoService.getById(idNota);
        $nota.then(function (datos) {
            if (datos.status === 200) {
                if (typeof cli.idCliente !== 'undefined') {
                    datos.data.idCliente = cli.idCliente;
                }
                datos.data.estadoUso = "SIN USO";
                $update = notaCreditoService.update(datos.data);
                $update.then(function (datos) {
                    if (datos.status === 200) {
                        toaster.pop({
                            type: 'success',
                            title: '¡Exito!',
                            body: 'Detalle agregado con exito.',
                            showCloseButton: false
                        });
                        ngDialog.closeAll();
                        $timeout(function timer() {
                            $state.go('nota_credito');
                        }, 2000);
                    }
                });
            }
        });
    };

    $scope.transferirItem = function (item) {
        ngDialog.open({
            template: 'views/transferencia/modal-transferir-item.html',
            className: 'ngdialog-theme-sm',
            showClose: false,
            controller: 'ModalController',
            closeByDocument: false,
            closeByEscape: false,
            data: {item: item}
        });
    };

    $scope.confirmarTransferirItem = function (item, cantidad) {
        if (cantidad <= item.cantidad) {
            ngDialog.open({
                template: 'views/transferencia/modal-confirmar-transferir-item.html',
                className: 'ngdialog-theme-sm',
                showClose: false,
                controller: 'ModalController',
                closeByDocument: false,
                closeByEscape: false,
                data: {item: item, cantidad: cantidad}
            });
        } else {
            toaster.pop({
                type: 'warning',
                title: '¡Advertencia!',
                body: 'La cantidad no puede superar al stock actual.',
                showCloseButton: false
            });
        }
    };

    $scope.finalizarTransferirItem = function (item, cantidad) {
        $transf = transferenciaService.getById($stateParams.idTransferencia);
        $transf.then(function (datos) {
            if (datos.status === 200) {
                $scope.detalleTransferencia.idTransferencia = datos.data;
                $scope.detalleTransferencia.producto = item.idProducto;
                $scope.detalleTransferencia.idStock = item.idStock;
                $scope.detalleTransferencia.idSucursal = item.idSucursal;
                $scope.detalleTransferencia.cantidad = cantidad;
                $add = detalleTransferenciaService.add($scope.detalleTransferencia);
                $add.then(function (datos) {
                    if (datos.status === 200) {
                        ngDialog.closeAll();
                        $rootScope.$broadcast('reloadTransferencias', {});
                        toaster.pop({
                            type: 'success',
                            title: '¡Exito!',
                            body: 'Detalle agregado con exito.',
                            showCloseButton: false
                        });
                    } else {
                        if (datos.status === 500) {
                            toaster.pop({
                                type: 'warning',
                                title: '¡Advertencia!',
                                body: 'Posiblemente el item ya existe.',
                                showCloseButton: false
                            });
                        }
                    }
                });
            }
        });
    };

    $scope.confirmarEliminarDetalleTransferencia = function (detalle) {
        $delete = detalleTransferenciaService.delete(detalle);
        $delete.then(function (datos) {
            if (datos.status === 200) {
                ngDialog.closeAll();
                $rootScope.$broadcast('reloadTransferencias', {});
                toaster.pop({
                    type: 'success',
                    title: '¡Exito!',
                    body: 'Detalle eliminado con exito.',
                    showCloseButton: false
                });
            }
        });
    };

    $scope.confirmarModificarDetalleTransferencia = function (detalle) {
        console.log(detalle);
        $update = detalleTransferenciaService.update(detalle);
        $update.then(function (datos) {
            if (datos.status === 200) {
                ngDialog.closeAll();
                $rootScope.$broadcast('reloadTransferencias', {});
                toaster.pop({
                    type: 'success',
                    title: '¡Exito!',
                    body: 'Detalle modificado con exito.',
                    showCloseButton: false
                });
            } else {
                ngDialog.closeAll();
                toaster.pop({
                    type: 'warning',
                    title: '¡Advertencia!',
                    body: datos.data.msg,
                    showCloseButton: false
                });
            }
        });
    };

    $scope.confirmarAceptarTransferencia = function () {
        $approve = transferenciaService.approve($stateParams.idTransferencia);
        $approve.then(function (datos) {
            console.log(datos);
            if (datos.status === 200) {
                ngDialog.closeAll();
                $rootScope.$broadcast('reloadTransferenciaDatos', {});
                toaster.pop({
                    type: 'success',
                    title: '¡Exito!',
                    body: datos.data.msg,
                    showCloseButton: false
                });
            } else {
                ngDialog.closeAll();
                toaster.pop({
                    type: 'warning',
                    title: '¡Advertencia!',
                    body: datos.data.msg,
                    showCloseButton: false
                });
            }
        });
    };

});
