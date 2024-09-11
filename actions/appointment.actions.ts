"use server";

import { ID, Query } from "node-appwrite";
import {  isToday } from "date-fns"; // Make sure to install date-fns for date manipulation

import { Appointment } from "@/types/appwrite.types";

import {
  APPOINTMENT_COLLECTION_ID,
  DATABASE_ID,
  databases,
  messaging,
} from "../lib/appwrite.config";
import {  parseStringify } from "../lib/utils";
import { revalidatePath } from "next/cache";
import { CreateAppointmentParams, Status, UpdateAppointmentParams } from "@/types";

//  CREATE APPOINTMENT
export const createAppointment = async (
  appointment: CreateAppointmentParams
) => {
  try {
    const newAppointment = await databases.createDocument(
      DATABASE_ID!,
      APPOINTMENT_COLLECTION_ID!,
      ID.unique(),
      {
        doctor: appointment ? appointment?.doctor?.$id : "",
        schedule: appointment.schedule,
        userId: appointment.userId,
        note: appointment.note,
        patient: appointment.patient,
        status: appointment.status,
        reason: appointment.reason,
        doctorId: appointment ? appointment.doctor?.$id : "",
        type: appointment.appointmentType,
      },
    )
revalidatePath("/admin")
revalidatePath("/doctor")
revalidatePath("/patient")
    return parseStringify(newAppointment);
  } catch (error) {
    console.error("An error occurred while creating a new appointment:", error);
  }
};

export const getAppointment = async (appointmentId: string) => {
  try {
    const appointment = await databases.getDocument(
      DATABASE_ID!,
      APPOINTMENT_COLLECTION_ID!,
      appointmentId
    );

    return parseStringify(appointment);
  } catch (error) {
    console.error(
      "An error occurred while retrieving the existing appointment:",
      error
    );
  }
};
export const getRecentAppointmentsList = async () => {
  const appointments = await databases.listDocuments(
    DATABASE_ID!,
    APPOINTMENT_COLLECTION_ID!,
    [Query.orderDesc("$createdAt")]
  );

  const initialCount = {
    scheduledCount: 0,
    cancelledCount: 0,
    pendingCount: 0,
  };

  const counts = (appointments.documents as Appointment[]).reduce(
    (acc, appointment) => {
      if (appointment.status === "pending") {
        acc.pendingCount++;
      } else if (appointment.status === "cancelled") {
        acc.cancelledCount++;
      } else {
        acc.scheduledCount++;
      }

      return acc;
    },
    initialCount
  );

  const data = {
    totalCount: appointments.total,
    ...counts,
    documents: appointments.documents,
  };

  return parseStringify(data);
};

export const updateAppointment = async ({
  appointment,
  appointmentId,
  type,
  userId,
}: UpdateAppointmentParams) => {
  try {
    // Update appointment to scheduled -> https://appwrite.io/docs/references/cloud/server-nodejs/databases#updateDocument
    const updateAppointment = await databases.updateDocument(
      DATABASE_ID!,
      APPOINTMENT_COLLECTION_ID!,
      appointmentId,
      appointment,
    )
    if (!updateAppointment) throw Error;
    revalidatePath("/admin");
    revalidatePath("/patients");
    return parseStringify(updateAppointment);
  } catch (error) {
    console.log("Error while updating the appointment", error);
  }
};

export const sendSmsNotification = async (userId: string, content: string) => {
  try {
    const message = await messaging.createSms(
      ID.unique(),
      content,
      [],
      [userId]
    );

    return parseStringify(message);
  } catch (error) {
    console.log("error while sending message: ", error);
  }
};

export const getAppointmentsByUserId = async (userId: string) => {
  try {
    const appointments = await databases.listDocuments(
      DATABASE_ID!,
      APPOINTMENT_COLLECTION_ID!,
      [Query.equal("userId", [userId]), Query.orderDesc("$createdAt")]
    );

    return parseStringify(appointments.documents);
  } catch (error) {}
};

export const getRecentAppointmentsListForDoctors = async (doctorId: string) => {
  // Fetch the appointments list for the doctor, ordered by creation date
  // if (!doctorId || typeof doctorId !== 'string') {
  //   throw new Error('Invalid doctorId provided.');
  // }
  const appointments = await databases.listDocuments(
    DATABASE_ID!,
    APPOINTMENT_COLLECTION_ID!,
    [
      Query.equal("doctorId", [doctorId!]), // Ensure the doctorId is passed as an array
      Query.orderDesc("$createdAt"),
    ]
  );

  // Initialize counts for different types of appointments
  const initialCount = {
    todayScheduledCount: 0, // Count for today's scheduled appointments
    requestedCount: 0, // Count for requested appointments
    recentScheduledCount: 0, // Count for all recent scheduled appointments
    totalCount: 0, // Total count of appointments
  };

  // Reduce function to calculate counts based on appointment status and date
  const counts = (appointments.documents as Appointment[]).reduce(
    (acc, appointment) => {
      const appointmentDate = new Date(appointment.schedule); // Parse the appointment date

      // Check if the appointment is scheduled for today
      if (appointment.status === "scheduled") {
        acc.recentScheduledCount++; // Increment for any scheduled appointment

        if (isToday(appointmentDate)) {
          acc.todayScheduledCount++; // Increment if the appointment is scheduled for today
        }
      }

      // Count requested appointments
      if (appointment.status === "pending") {
        acc.requestedCount++;
      }

      acc.totalCount++; // Increment the total count
      return acc;
    },
    initialCount
  );

  // Prepare the data object to be returned
  const data = {
    totalCount: counts.totalCount, // Total number of appointments
    todayScheduledCount: counts.todayScheduledCount, // Today's scheduled appointments
    requestedCount: counts.requestedCount, // Requested appointments count
    recentScheduledCount: counts.recentScheduledCount, // Recent scheduled appointments
    documents: appointments.documents, // List of appointment documents
  };

  return parseStringify(data); // Return the processed data
};

export const updateStatus = async (status: Status, appointmentId: string) => {
  try {
    const document = await databases.updateDocument(
      DATABASE_ID!,
      APPOINTMENT_COLLECTION_ID!,
      appointmentId,
      {
        status: status
      }
    )

    revalidatePath("/doctor")
    revalidatePath("/admin")
    revalidatePath("/patient")

    return parseStringify(document)
  } catch (error) {

  }
}
export const updatePaymentStatus = async (appointmentId: string) => {
  try {
    const document = await databases.updateDocument(
      DATABASE_ID!,
      APPOINTMENT_COLLECTION_ID!,
      appointmentId,
      {
        isPaid: true
      }
    )
    revalidatePath("/admin")
    return parseStringify(document)
  } catch (error) {
    console.log("error updating payment status: ", error)
  }
}
export const addPresprictionUrlToDb = async (appointmentId: string, link: string) => {
  try {
    const document = await databases.updateDocument(
      DATABASE_ID!,
      APPOINTMENT_COLLECTION_ID!,
      appointmentId,
      {
        presprictionLink: link
      }
    )
    revalidatePath("/doctor")
    revalidatePath("/patient")
    return parseStringify(document)
  } catch (error) {
    console.log("error adding presprictionLink to db: ", error)
  }
}
