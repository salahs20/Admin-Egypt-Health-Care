import React, { useEffect, useState, useRef } from "react";
import { db } from "../../../../firebase/firebase";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

const UserTable = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [newUser, setNewUser] = useState({ name: "", email: "", phone: "" });
  const [appointments, setAppointments] = useState([]);
  const [appointmentSearchTerm, setAppointmentSearchTerm] = useState(""); // New state for appointment search term
  const [errorMessage, setErrorMessage] = useState("");
  const [editingAppointment, setEditingAppointment] = useState(null);
  const editRef = useRef(null); // مرجع لتحديد العنصر الذي يتم تعديله

  const handleError = (error, message) => {
    console.error(message, error);
    setErrorMessage(message);
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        setUsers(
          querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            highlightColor: "bg-white", // اللون الافتراضي
          }))
        );
      } catch (error) {
        handleError(error, "حدث خطأ أثناء تحميل بيانات المستخدمين.");
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "Appointments"));
        setAppointments(
          querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      } catch (error) {
        handleError(error, "حدث خطأ أثناء تحميل بيانات المواعيد.");
      }
    };

    fetchAppointments();
  }, []);

  const handleDeleteAppointment = async (appointmentId) => {
    if (window.confirm("هل أنت متأكد من أنك تريد حذف هذا الموعد؟")) {
      try {
        await deleteDoc(doc(db, "Appointments", appointmentId));
        setAppointments(
          appointments.filter((appointment) => appointment.id !== appointmentId)
        );
      } catch (error) {
        handleError(error, "حدث خطأ أثناء حذف الموعد.");
      }
    }
  };

  const handleEditAppointment = (appointment) => {
    setEditingAppointment(appointment);
    setTimeout(() => {
      if (editRef.current) {
        editRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100); // التمرير إلى العنصر
  };

  const handleSaveAppointment = async () => {
    if (editingAppointment) {
      try {
        const appointmentRef = doc(db, "Appointments", editingAppointment.id);
        await updateDoc(appointmentRef, editingAppointment);
        setAppointments(
          appointments.map((appointment) =>
            appointment.id === editingAppointment.id
              ? editingAppointment
              : appointment
          )
        );
        setEditingAppointment(null);
        setTimeout(() => {
          if (editRef.current) {
            editRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 100); // العودة إلى العنصر بعد الحفظ
      } catch (error) {
        handleError(error, "حدث خطأ أثناء تعديل الموعد.");
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditingAppointment({ ...editingAppointment, [name]: value });
  };

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.phone) {
      setErrorMessage("جميع الحقول مطلوبة.");
      return;
    }
    try {
      const docRef = await addDoc(collection(db, "users"), newUser);
      setUsers([...users, { id: docRef.id, ...newUser }]);
      setNewUser({ name: "", email: "", phone: "" });
      setErrorMessage("");
    } catch (error) {
      handleError(error, "تعذر إضافة المستخدم.");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("هل أنت متأكد من أنك تريد حذف هذا المستخدم؟")) {
      try {
        await deleteDoc(doc(db, "users", userId));
        setUsers(users.filter((user) => user.id !== userId));
      } catch (error) {
        handleError(error, "تعذر حذف المستخدم.");
      }
    }
  };

  const handleToggleAdmin = async (userId) => {
    try {
      const userRef = doc(db, "users", userId);
      const updatedUser = users.find((user) => user.id === userId);
      const newAdminStatus = !updatedUser.isAdmin;
      await updateDoc(userRef, { isAdmin: newAdminStatus });
      setUsers(
        users.map((user) =>
          user.id === userId ? { ...user, isAdmin: newAdminStatus } : user
        )
      );
    } catch (error) {
      handleError(error, "تعذر تعديل صلاحيات المستخدم.");
    }
  };

  const handleSendWhatsApp = (appointment) => {
    const phoneNumber = appointment.phone.startsWith("+")
      ? appointment.phone
      : `+20${appointment.phone}`;
    const message =
      `مرحبًا ${appointment.name}،\n\n` +
      `تفاصيل الموعد الخاص بك:\n` +
      `- المكان: ${appointment.type} ${appointment.clinicOrCenter}\n` +
      `- المحافظة: ${appointment.province}\n` +
      `- التخصص: ${appointment.service}\n` +
      `- الموعد: ${appointment.appointment}\n` +
      `- الرسالة: ${appointment.message}\n\n` +
      `شكرًا لتواصلك معنا!` +
      `Egypt Health Care`;

    const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
      message
    )}`;
    window.open(whatsappURL, "_blank");
  };

  const handleSendEmail = (appointment) => {
    const email = appointment.email;
    const subject = "تفاصيل الموعد الخاص بك";
    const body =
      `مرحبًا ${appointment.name}،\n\n` +
      `تفاصيل الموعد الخاص بك:\n` +
      `- المكان: ${appointment.type} ${appointment.clinicOrCenter}\n` +
      `- المحافظة: ${appointment.province}\n` +
      `- التخصص: ${appointment.service}\n` +
      `- الموعد: ${appointment.appointment}\n` +
      `- الرسالة: ${appointment.message}\n\n` +
      `شكرًا لتواصلك معنا!` +
      `Egypt Health Care`;

    const mailtoURL = `mailto:${email}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    window.open(mailtoURL, "_blank");
  };

  const handleChangeColor = (userId, color) => {
    setUsers(
      users.map((user) =>
        user.id === userId ? { ...user, highlightColor: color } : user
      )
    );
  };

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAppointments = appointments.filter((appointment) =>
    appointment.name.toLowerCase().includes(appointmentSearchTerm.toLowerCase())
  );

  return (
    <div className="pb-8 sm:px-6 lg:px-8">
      <div className="md:ps-[11rem] mx-auto bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-3xl font-semibold text-blue-700 mb-6 text-center">
          إدارة المستخدمين
        </h2>

        {errorMessage && (
          <p className="text-red-500 mb-4 text-center">{errorMessage}</p>
        )}

        <div className="mb-3">
          <input
            type="text"
            className="border border-gray-300 py-2 px-4 rounded w-full"
            placeholder="الاسم"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
          />
          <input
            type="text"
            className="border border-gray-300 py-2 px-4 rounded w-full"
            placeholder="البريد الإلكتروني"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
          />
          <input
            type="text"
            className="border border-gray-300 py-2 px-4 rounded w-full"
            placeholder="رقم الهاتف"
            value={newUser.phone}
            onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
          />
          <button
            onClick={handleAddUser}
            className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded w-full sm:w-auto"
          >
            إضافة مستخدم
          </button>
        </div>

        <div className="mb-6">
          <input
            type="text"
            className="border border-gray-300 py-2 px-4 rounded w-full"
            placeholder="ابحث عن مستخدم"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300 text-left">
            <thead className="bg-gray-200 text-gray-700">
              <tr>
                <th className="py-3 px-4"></th>
                <th className="py-3 px-4">الاسم</th>
                <th className="py-3 px-4">البريد الإلكتروني</th>
                <th className="py-3 px-4">رقم الهاتف</th>
                <th className="py-3 px-4">الأدمن</th>
                {/* <th className="py-3 px-4">تغيير اللون</th> */}
                <th className="py-3 px-4">حذف</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <tr
                  key={user.id}
                  className={`border-b hover:bg-gray-100 ${user.highlightColor}`}
                >
                  <td className="py-3 px-4">{index + 1}</td>
                  <td className="py-3 px-4">{user.name}</td>
                  <td className="py-3 px-4">{user.email}</td>
                  <td className="py-3 px-4">{user.phone}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleToggleAdmin(user.id)}
                      className={`py-1 px-3 rounded w-full ${
                        user.isAdmin ? "bg-blue-500" : "bg-gray-500"
                      } text-white`}
                    >
                      {user.isAdmin ? "إزالة الأدمن" : "تعيين أدمن"}
                    </button>
                  </td>
                  {/* <td className="py-3 px-4">
                    <select
                      onChange={(e) => handleChangeColor(user.id, e.target.value)}
                      className="border border-gray-300 py-1 px-2 rounded"
                    >
                      <option value="bg-white">أبيض</option>
                      <option value="bg-red-100">أحمر</option>
                      <option value="bg-green-100">أخضر</option>
                      <option value="bg-blue-100">أزرق</option>
                      <option value="bg-yellow-100">أصفر</option>
                    </select>
                  </td> */}
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded w-full"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h2 className="text-3xl font-semibold text-blue-700 mb-6 text-center mt-8">
          جدول الحجز
        </h2>

        {errorMessage && (
          <p className="text-red-500 mb-4 text-center">{errorMessage}</p>
        )}

        <div className="mb-6">
          <input
            type="text"
            className="border border-gray-300 py-2 px-4 rounded w-full"
            placeholder="بحث"
            value={appointmentSearchTerm}
            onChange={(e) => setAppointmentSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300 text-left">
            <thead className="bg-gray-200 text-gray-700">
              <tr>
                <th className="py-3 px-4"></th>
                <th className="py-3 px-4">الاسم</th>
                <th className="py-3 px-4">رقم الهاتف</th>
                <th className="py-3 px-4">الايميل</th>
                <th className="py-3 px-4">المكان </th>
                <th className="py-3 px-4">المحافظة </th>
                <th className="py-3 px-4">التخصص</th>
                <th className="py-3 px-4">المواعيد</th>
                <th className="py-3 px-4">الرسالة</th>
                <th className="py-3 px-4">تعديل</th>
                <th className="py-3 px-4">حذف</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map((appointment, index) => (
                <tr
                  key={appointment.id}
                  ref={editingAppointment?.id === appointment.id ? editRef : null} // تحديد العنصر
                  className="border-b hover:bg-gray-100"
                >
                  <td className="py-3 px-4">{index + 1}</td>
                  <td className="py-3 px-4">{appointment.name}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleSendWhatsApp(appointment)}
                      className="text-blue-500 hover:underline"
                    >
                      {appointment.phone}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleSendEmail(appointment)}
                      className="text-blue-500 hover:underline"
                    >
                      {appointment.email}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    {appointment.type} {appointment.clinicOrCenter}
                  </td>
                  <td className="py-3 px-4">{appointment.province}</td>
                  <td className="py-3 px-4">{appointment.service}</td>
                  <td className="py-3 px-4">{appointment.appointment}</td>
                  <td className="py-3 px-4">{appointment.message}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleEditAppointment(appointment)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-3 rounded w-full"
                    >
                      تعديل
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleDeleteAppointment(appointment.id)}
                      className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded w-full"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {editingAppointment && (
          <div className="mt-6" ref={editRef}>
            <h3 className="text-2xl font-semibold text-blue-700 mb-4 text-center">
              تعديل الموعد
            </h3>
            <div className="mb-3">
              <input
                type="text"
                className="border border-gray-300 py-2 px-4 rounded w-full"
                placeholder="الاسم"
                name="name"
                value={editingAppointment.name}
                onChange={handleChange}
              />
              <input
                type="text"
                className="border border-gray-300 py-2 px-4 rounded w-full"
                placeholder="رقم الهاتف"
                name="phone"
                value={editingAppointment.phone}
                onChange={handleChange}
              />
              <input
                type="text"
                className="border border-gray-300 py-2 px-4 rounded w-full"
                placeholder="الايميل"
                name="email"
                value={editingAppointment.email}
                onChange={handleChange}
              />
              <input
                type="text"
                className="border border-gray-300 py-2 px-4 rounded w-full"
                placeholder="المكان"
                name="clinicOrCenter"
                value={editingAppointment.clinicOrCenter}
                onChange={handleChange}
              />
              <input
                type="text"
                className="border border-gray-300 py-2 px-4 rounded w-full"
                placeholder="المحافظة"
                name="province"
                value={editingAppointment.province}
                onChange={handleChange}
              />
              <input
                type="text"
                className="border border-gray-300 py-2 px-4 rounded w-full"
                placeholder="التخصص"
                name="service"
                value={editingAppointment.service}
                onChange={handleChange}
              />
              <input
                type="text"
                className="border border-gray-300 py-2 px-4 rounded w-full"
                placeholder="المواعيد"
                name="appointment"
                value={editingAppointment.appointment}
                onChange={handleChange}
              />
              <input
                type="text"
                className="border border-gray-300 py-2 px-4 rounded w-full"
                placeholder="الرسالة"
                name="message"
                value={editingAppointment.message}
                onChange={handleChange}
              />
              <button
                onClick={handleSaveAppointment}
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded w-full sm:w-auto"
              >
                حفظ التعديلات
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserTable;
