import { Request, Response, NextFunction } from "express";
import { IEmpleadoUseCase } from "@core/ports/in/empleados/IEmpleadoUseCase";

export class EmpleadosController {

    // El controller recibe el caso de uso por inyección de dependencias,
    // igual que con auth — nunca instancia nada directamente.
    constructor(private readonly empleados)

}