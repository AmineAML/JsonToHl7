import { Injectable } from '@nestjs/common';
import HL7 = require('hl7-standard');

@Injectable()
export class AppService {
  createMessage(objectPatient): any {
    const hl7 = new HL7();

    // We start by creating the segments we need for the patient admission
    hl7.createSegment('MSH');
    hl7.createSegment('PID');
    hl7.createSegment('NK1');
    hl7.createSegment('PD1');

    // MKH
    hl7.set('MSH', {
      'MSH.2': '^~\\&',
      'MSH.3': 'EXIP',
      'MSH.4': 'EXIPCORP',
      'MSH.5': 'RON',
      'MSH.6': 'RONDOC',
      'MSH.7': Date.now().toString(),
      'MSH.8': 'SEC',
      'MSH.9': {
        'MSH.9.1': 'ADT',
        'MSH.9.2': 'A04',
        'MSH.9.3': 'ADT_A01',
      },
      'MSH.10': '187',
      'MSH.11': 'T',
      'MSH.12': '2.3',
    });

    // PID
    hl7.set(
      'PID.3',
      objectPatient['identifier'].map((id) => {
        return {
          'PID.3.1': id['value'],
          'PID.3.5': id['type']['coding'].pop()['code'],
        };
      }),
    );

    hl7.set('PID.5', {
      'PID.5.1.1': objectPatient['name'][0]['family'],
      'PID.5.2': objectPatient['name'][0]['given'].join(' '),
    });

    objectPatient['telecom'].map((telec) => {
      if (telec.use) {
        if (telec.use == 'mobile') {
          hl7.set('PID.40', {
            'PID.40.7': telec['value'],
            'PID.40.3': this.getStandardTelecomDeviceType(telec['system']),
          });
        }
        if (telec.use == 'work') {
          hl7.set('PID.14', {
            'PID.14.7': telec['value'],
            'PID.14.3': this.getStandardTelecomDeviceType(telec['system']),
          });
        }
        if (telec.use == 'home') {
          hl7.set('PID.13', {
            'PID.13.7': telec['value'],
            'PID.13.3': this.getStandardTelecomDeviceType(telec['system']),
          });
        }
      }
    });

    hl7.set('PID.8', this.getGenderPrefix(objectPatient['gender']));

    hl7.set('PID.7', objectPatient['birthDate']);

    hl7.set(
      'PID.11',
      objectPatient['address'].map((addr) => {
        return {
          'PID.11.1.1': addr['text'],
          'PID.11.3': addr['city'],
          'PID.11.5': addr['postalCode'],
          'PID.11.6': addr['country'],
          'PID.11.7': this.getAddressType(addr['use']),
        };
      }),
    );

    hl7.set(
      'PID.16',
      objectPatient['maritalStatus']['coding'].map((marStat) => {
        return {
          'PID.16': marStat.code,
        };
      }),
    );

    const relationshipCoding = objectPatient['contact'].map((con) => {
      return con['relationship'].map((rel) => {
        return rel['coding'];
      });
    });

    // NK1
    hl7.set(
      'NK1.3',
      relationshipCoding.flat(Infinity).map((cod) => {
        return {
          'NK1.3': this.getRelationshipValue(cod.code),
        };
      }),
    );

    hl7.set(
      'NK1.2',
      objectPatient['contact'].map((con) => {
        return {
          'NK1.2.1.1': con['name']['family'],
          'NK1.2.2': con['name']['given'].join(' '),
        };
      }),
    );

    const telec = objectPatient['contact'].map((c) => {
      return c['telecom'];
    });

    hl7.set(
      'NK1.5',
      telec.flat(Infinity).map((tele) => {
        return {
          'NK1.5.3': this.getStandardTelecomDeviceType(tele['system']),
          'NK1.5.7': tele['value'],
        };
      }),
    );

    // PD1
    hl7.set(
      'PD1.4',
      objectPatient['generalPractitioner'].map((generalPract) => {
        return {
          'PD1.4': generalPract.reference,
        };
      }),
    );

    const finalizedHL7 = hl7.build();

    return finalizedHL7;
  }

  private getStandardTelecomDeviceType(telecomSystem: string): string {
    const telecomEquipments = [
      {
        value: 'BP',
        description: 'Beeper',
      },
      {
        value: 'CP',
        description: 'Cellular or Mobile Phone',
      },
      // ...
    ];

    const telecomType =
      telecomEquipments.find((f) =>
        f.description.toLowerCase().includes(telecomSystem.toLowerCase()),
      )?.value || telecomSystem; // if nothing matches then return the same value (that's only applicable as our array is not fully supplied with all possible standards data)

    return telecomType;
  }

  private getGenderPrefix(gender: string): string {
    const genders = [
      {
        value: 'A',
        description: 'Ambiguous',
      },
      {
        value: 'F',
        description: 'Female',
      },
      {
        value: 'M',
        description: 'Male',
      },
      // ...
    ];

    const genderPrefix =
      genders.find((f) =>
        f.description.toLowerCase().includes(gender.toLowerCase()),
      )?.value || gender; // if nothing matches then return the same value (that's only applicable as our array is not fully supplied with all possible standards data)

    return genderPrefix;
  }

  private getAddressType(addrType: string): string {
    const types = [
      {
        value: 'B',
        description: 'Firm/Business',
      },
      {
        value: 'H',
        description: 'Home',
      },
      // ...
    ];

    const addrValue =
      types.find((f) =>
        f.description.toLowerCase().includes(addrType.toLowerCase()),
      )?.value || addrType; // if nothing matches then return the same value (that's only applicable as our array is not fully supplied with all possible standards data)

    return addrValue;
  }

  private getRelationshipValue(relationshipCode: string): string {
    const relationshipTypes = [
      {
        value: 'ASC',
        description: 'Associate',
      },
      {
        value: 'MTH',
        description: 'Mother',
      },
      // ...
    ];

    const relationshipValue =
      relationshipTypes.find((f) =>
        f.description.toLowerCase().includes(relationshipCode.toLowerCase()),
      )?.value || relationshipCode; // if nothing matches then return the same value (that's only applicable as our array is not fully supplied with all possible standards data)

    console.log(relationshipValue);

    return relationshipValue;
  }
}
