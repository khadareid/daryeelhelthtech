import { saasApi, type SaaSJson } from "../../lib/saasClient";

function unwrap(json: SaaSJson) {
  return json.data ?? json.result ?? json;
}

export const SaasIntegrationService = {
  async searchHospitals(query: Record<string, any>) {
    return saasApi.listHospitals(query);
  },

  async getHospital(hospitalId: string) {
    return saasApi.getHospital(hospitalId);
  },

  async listDepartments(hospitalId: string) {
    try {
      return await saasApi.listDepartments(hospitalId);
    } catch (error: any) {
      // Fallback: derive departments from hospital facilities + doctor specialties
      if (error?.status === 404) {
        const hospital = await saasApi.getHospital(hospitalId);
        const data = unwrap(hospital) as any;
        const facilities = Array.isArray(data?.facilities) ? data.facilities : [];
        const doctors = Array.isArray(data?.doctors) ? data.doctors : [];
        const specialtySet = new Map<string, any>();
        for (const d of doctors) {
          const name = d?.specialization || d?.department?.name;
          if (!name) continue;
          if (!specialtySet.has(name)) {
            specialtySet.set(name, {
              departmentId: `specialty:${String(name).toLowerCase().replace(/\s+/g, "-")}`,
              name,
              type: "SPECIALTY",
              hospitalId,
            });
          }
        }
        const facilityDepartments = facilities.map((f: any) => ({
          departmentId: f.facilityId,
          name: f.name,
          type: "FACILITY",
          hospitalId,
          city: f.city || null,
          isMain: Boolean(f.isMain),
        }));
        const departments = [
          ...facilityDepartments,
          ...Array.from(specialtySet.values()),
        ];
        return {
          isSuccess: true,
          data: departments,
          result: departments,
        };
      }
      throw error;
    }
  },

  async listHospitalDoctors(hospitalId: string, query?: Record<string, any>) {
    return saasApi.listDoctors(hospitalId, query);
  },

  async searchDoctors(query?: Record<string, any>) {
    try {
      return await saasApi.listAllDoctors(query);
    } catch (error: any) {
      if (error?.status === 404 && query?.hospitalId) {
        return saasApi.listDoctors(String(query.hospitalId), query);
      }
      throw error;
    }
  },

  async getDoctor(doctorId: string) {
    return saasApi.getDoctor(doctorId);
  },

  async getDoctorAvailability(doctorId: string, date?: string) {
    return saasApi.getAvailability(doctorId, date);
  },

  async createAppointment(body: unknown, idempotencyKey?: string) {
    return saasApi.createAppointment(body, idempotencyKey);
  },

  async listAppointments(healthtechUserId: string) {
    return saasApi.listAppointments(healthtechUserId);
  },

  async getAppointment(id: string) {
    return saasApi.getAppointment(id);
  },

  async cancelAppointment(id: string, body: unknown) {
    return saasApi.cancelAppointment(id, body);
  },

  async requestReschedule(id: string, body: unknown) {
    return saasApi.requestReschedule(id, body);
  },

  async respondReschedule(id: string, body: unknown) {
    return saasApi.respondReschedule(id, body);
  },

  async submitReview(id: string, body: unknown) {
    return saasApi.submitReview(id, body);
  },

  async getOpdTicket(id: string) {
    return saasApi.getOpdTicket(id);
  },

  async getVisit(id: string) {
    return saasApi.getVisit(id);
  },
};
