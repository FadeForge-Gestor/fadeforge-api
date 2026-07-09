# Misión

Hoy gestionar citas en una barbería depende de llamadas, mensajes o pasar en persona: el cliente no tiene visibilidad de su cita y el dueño no tiene control centralizado de servicios, empleados ni historial. Este proyecto existe para resolver eso: darle a cada barbería un sistema propio donde clientes, empleados y dueño gestionan las citas de punta a punta, sin fricción y sin depender de canales informales.

## Qué construimos

Un gestor integral de citas para barberías que da control total tanto a los dueños del negocio como a sus clientes.

_Piezas principales del producto:_

1. **Agenda para clientes** — el cliente agenda o cancela sus citas desde su casa, ve la hora de su cita y recibe un recordatorio.
2. **Panel de administración** — el dueño (admin) crea servicios, asigna empleados, revisa citas y tiene control total del negocio, además de llevar un historial de sus servicios.
3. **Gestión para empleados** — el empleado atiende, revisa y gestiona las citas que tiene asignadas.

## Para quién

- **Clientes** — quieren agendar o cancelar su cita sin llamar ni ir presencialmente, y no perderla de vista gracias al recordatorio.
- **Dueños de barbería (admin)** — necesitan control total: qué servicios se ofrecen, qué empleado atiende qué, y un historial de lo realizado.
- **Empleados** — necesitan ver, atender y gestionar las citas que les corresponden.

## Principios

- **Autoservicio del cliente** — agendar y cancelar no debe requerir intervención de un empleado o admin.
- **Control total del admin** — servicios, empleados y citas se administran desde un único panel, sin cabos sueltos.
- **Trazabilidad** — el historial de servicios queda registrado para el admin, no se pierde información de lo ya atendido.
- **Roles con responsabilidades claras** — cliente, empleado y admin tienen capacidades distintas y no se pisan entre sí.

## Qué NO es

- No es una plataforma multi-negocio: está pensada para una sola barbería por instancia (single-tenant).
- No reemplaza la atención presencial del servicio en sí, solo la gestión de citas alrededor de ella.