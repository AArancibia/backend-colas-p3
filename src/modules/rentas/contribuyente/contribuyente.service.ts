import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import * as request from 'request';

@Injectable()
export class ContribuyenteService {
  urlReniec: string = 'http://192.168.10.6:5050/platpide/buscardni';
  urlRentas: string = 'http://192.168.10.208:3032/api/rentas/'; //207:4521
  private logger = new Logger('ContribuyenteService');
  constructor() {}

  async getContribuyenteByDniReniec(dni) {
    const persona = new Promise(async (resolve, reject) => {
      await request.post(
        `${this.urlReniec}`,
        {
          json: true,
          body: {
            nuRucUsuario: 20187346488,
            nuDniUsuario: 73891928,
            nuDniConsulta: dni,
            password: 73891928,
          },
        },
        (err, res, body) => {
          if (err) {
            reject(() => {
              throw new HttpException(err, HttpStatus.INTERNAL_SERVER_ERROR);
            });
          }
          if (!res)
            reject(() => {
              throw new HttpException(
                'ERROR CONSULTA A RENIEC',
                HttpStatus.INTERNAL_SERVER_ERROR,
              );
            });
          const { statusCode } = res;
          resolve({
            statusCode,
            method: 'POST',
            body,
          });
        },
      );
    });
    if (!Object.keys(persona)) {
      this.logger.log('No existe la persona en RENIEC, ');
      throw new HttpException(
        `Error No hay Registro, Verificar DNI `,
        HttpStatus.NOT_FOUND,
      );
    }
    const per: any = await persona;
    return per.body.datosPersona;
  }

  getIdContribuyenteRentas(nuDniConsulta, per) {
    if (!per)
      throw new HttpException(
        `Verificar PlatPide `,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    const { apPrimer, apSegundo, prenombres, foto } = per;
    //if ( !apPrimer || !apSegundo || !prenombres ) throw new HttpException('No Hay nombres', HttpStatus.INTERNAL_SERVER_ERROR );
    const contribuyente: any = new Promise(async (resolve, reject) => {
      await request.get(
        `${this.urlRentas}contribuyente`,
        {
          json: true,
          body: {
            apPrimer,
            apSegundo,
            nuDniConsulta,
            prenombres,
          },
        },
        (err, res, body) => {
          if (err) {
            reject(() => {
              throw new HttpException(
                'ERROR',
                HttpStatus.INTERNAL_SERVER_ERROR,
              );
            });
          }
          if (!res) {
            reject(() => {
              throw new HttpException(
                'Revisar PlatPide',
                HttpStatus.INTERNAL_SERVER_ERROR,
              );
            });
          }
          const { statusCode } = res;
          resolve({
            statusCode,
            method: 'POST',
            body: body.length < 1 ? null : body[0].codContr,
          });
        },
      );
    });
    return contribuyente;
  }
}
