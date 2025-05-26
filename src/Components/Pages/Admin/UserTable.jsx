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
import { Tabs, Tab, Box } from "@mui/material";
import ExportButton from "../../Shared/ExportButton";

import Statistics from "../../Shared/Statistics";
import { toast } from "react-toastify";

const ERROR_MESSAGES = {
  fetchUsers: "حدث خطأ أثناء تحميل بيانات المستخدمين.",
  fetchAppointments: "حدث خطأ أثناء تحميل بيانات المواعيد.",
  deleteAppointment: "حدث خطأ أثناء حذف الموعد.",
  updateAppointment: "حدث خطأ أثناء تعديل الموعد.",
  addUser: "تعذر إضافة المستخدم.",
  deleteUser: "تعذر حذف المستخدم.",
  toggleAdmin: "تعذر تعديل صلاحيات المستخدم.",
  addAppointment: "حدث خطأ أثناء إضافة الموعد.",
};

const TextInput = ({ placeholder, value, onChange }) => (
  <input
    type="text"
    className="border border-gray-300 py-2 px-4 rounded w-full"
    placeholder={placeholder}
    value={value}
    onChange={onChange}
  />
);

const UserTable = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [newUser, setNewUser] = useState({ name: "", email: "", phone: "" });
  const [appointments, setAppointments] = useState([]);
  const [appointmentSearchTerm, setAppointmentSearchTerm] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [commentText, setCommentText] = useState("");
  const editRef = useRef(null);

  const handleError = (error, message) => {
    console.error(message, error);
    setErrorMessage(message);
    toast.error(message);
  };

  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        setUsers(
          querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            highlightColor: "bg-white",
          }))
        );
      } catch (error) {
        handleError(error, ERROR_MESSAGES.fetchUsers);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoadingAppointments(true);
      try {
        const querySnapshot = await getDocs(collection(db, "Appointments"));
        const fetchedAppointments = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAppointments(fetchedAppointments);
        setFilteredAppointments(fetchedAppointments);
      } catch (error) {
        handleError(error, ERROR_MESSAGES.fetchAppointments);
      } finally {
        setLoadingAppointments(false);
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
        setFilteredAppointments(
          filteredAppointments.filter(
            (appointment) => appointment.id !== appointmentId
          )
        );
        toast.success("تم حذف الموعد بنجاح");
      } catch (error) {
        handleError(error, ERROR_MESSAGES.deleteAppointment);
      }
    }
  };

  const handleEditAppointment = (appointment) => {
    setEditingAppointment(appointment);
    setTimeout(() => {
      if (editRef.current) {
        editRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
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
        setFilteredAppointments(
          filteredAppointments.map((appointment) =>
            appointment.id === editingAppointment.id
              ? editingAppointment
              : appointment
          )
        );
        setEditingAppointment(null);
        toast.success("تم تحديث الموعد بنجاح");
      } catch (error) {
        handleError(error, ERROR_MESSAGES.updateAppointment);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditingAppointment({ ...editingAppointment, [name]: value });
  };

  const handleAddUser = async () => {
    if (Object.values(newUser).some((field) => !field.trim())) {
      setErrorMessage("جميع الحقول مطلوبة.");
      return;
    }
    try {
      const docRef = await addDoc(collection(db, "users"), newUser);
      setUsers([...users, { id: docRef.id, ...newUser }]);
      setNewUser({ name: "", email: "", phone: "" });
      setErrorMessage("");
      toast.success("تم إضافة المستخدم بنجاح");
    } catch (error) {
      handleError(error, ERROR_MESSAGES.addUser);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("هل أنت متأكد من أنك تريد حذف هذا المستخدم؟")) {
      try {
        await deleteDoc(doc(db, "users", userId));
        setUsers(users.filter((user) => user.id !== userId));
        toast.success("تم حذف المستخدم بنجاح");
      } catch (error) {
        handleError(error, ERROR_MESSAGES.deleteUser);
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
      toast.success(
        `تم ${newAdminStatus ? "تعيين" : "إزالة"} صلاحيات الأدمن بنجاح`
      );
    } catch (error) {
      handleError(error, ERROR_MESSAGES.toggleAdmin);
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
      `- العنوان: ${appointment.address}\n` +
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

  const handleWhatsAppClick = (appointment) => {
    const phoneNumber = appointment.phone.startsWith("+")
      ? appointment.phone
      : `+20${appointment.phone}`;
    const message = `مرحبًا ${appointment.name}،\n\nتفاصيل الموعد الخاص بك:\n...`;
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
      `- العنوان: ${appointment.address}\n` +
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

  const handleFilterAppointments = (filters) => {
    const filtered = appointments.filter((appointment) => {
      const matchesProvince = filters.province
        ? appointment.province
            .toLowerCase()
            .includes(filters.province.toLowerCase())
        : true;
      const matchesService = filters.service
        ? appointment.service
            .toLowerCase()
            .includes(filters.service.toLowerCase())
        : true;
      const matchesDate = filters.date
        ? new Date(appointment.appointment).toDateString() ===
          new Date(filters.date).toDateString()
        : true;

      return matchesProvince && matchesService && matchesDate;
    });

    setFilteredAppointments(filtered);
  };

  const handleAddAppointment = async (newAppointment) => {
    try {
      const appointmentData = {
        ...newAppointment,
        registrationDate: new Date().toISOString(),
        dataSent: false,
        comments: ""
      };
      const docRef = await addDoc(collection(db, "Appointments"), appointmentData);
      const appointmentWithId = { id: docRef.id, ...appointmentData };
      setAppointments([...appointments, appointmentWithId]);
      setFilteredAppointments([...filteredAppointments, appointmentWithId]);
      toast.success("تم إضافة الموعد بنجاح");
    } catch (error) {
      handleError(error, ERROR_MESSAGES.addAppointment);
    }
  };

  const handleToggleAppointmentDataSent = async (appointmentId) => {
    try {
      const appointmentRef = doc(db, "Appointments", appointmentId);
      const updatedAppointment = appointments.find((app) => app.id === appointmentId);
      const newDataSentStatus = !updatedAppointment.dataSent;
      await updateDoc(appointmentRef, { dataSent: newDataSentStatus });
      setAppointments(
        appointments.map((app) =>
          app.id === appointmentId ? { ...app, dataSent: newDataSentStatus } : app
        )
      );
      setFilteredAppointments(
        filteredAppointments.map((app) =>
          app.id === appointmentId ? { ...app, dataSent: newDataSentStatus } : app
        )
      );
      toast.success(
        `تم ${newDataSentStatus ? "تحديد" : "إلغاء تحديد"} إرسال البيانات بنجاح`
      );
    } catch (error) {
      handleError(error, "حدث خطأ أثناء تحديث حالة إرسال البيانات");
    }
  };

  const handleUpdateAppointmentComments = async (appointmentId, comments) => {
    try {
      const appointmentRef = doc(db, "Appointments", appointmentId);
      await updateDoc(appointmentRef, { comments });
      setAppointments(
        appointments.map((app) =>
          app.id === appointmentId ? { ...app, comments } : app
        )
      );
      setFilteredAppointments(
        filteredAppointments.map((app) =>
          app.id === appointmentId ? { ...app, comments } : app
        )
      );
      toast.success("تم تحديث التعليقات بنجاح");
    } catch (error) {
      handleError(error, "حدث خطأ أثناء تحديث التعليقات");
    }
  };

  const handleOpenCommentModal = (appointment) => {
    setSelectedAppointment(appointment);
    setCommentText(appointment.comments || "");
    setShowCommentModal(true);
  };

  const handleCloseCommentModal = () => {
    setShowCommentModal(false);
    setSelectedAppointment(null);
    setCommentText("");
  };

  const handleSaveComment = async () => {
    if (selectedAppointment) {
      try {
        const appointmentRef = doc(db, "Appointments", selectedAppointment.id);
        await updateDoc(appointmentRef, { comments: commentText });
        setAppointments(
          appointments.map((app) =>
            app.id === selectedAppointment.id ? { ...app, comments: commentText } : app
          )
        );
        setFilteredAppointments(
          filteredAppointments.map((app) =>
            app.id === selectedAppointment.id ? { ...app, comments: commentText } : app
          )
        );
        toast.success("تم حفظ التعليق بنجاح");
        handleCloseCommentModal();
      } catch (error) {
        handleError(error, "حدث خطأ أثناء حفظ التعليق");
      }
    }
  };

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filterFields = [
    { name: "province", label: "المحافظة", type: "text" },
    { name: "service", label: "التخصص", type: "text" },
    { name: "date", label: "التاريخ", type: "date" },
  ];

  return (
    <div className="pb-8 sm:px-6 lg:px-8">
      <div className="pe-[5rem] mx-auto bg-white p-6 shadow-lg">
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          className="mb-6"
        >
          <Tab label="المستخدمين" />
          <Tab label="المواعيد" />
          {/* <Tab label="التقويم" /> */}
          <Tab label="الإحصائيات" />
        </Tabs>

        {activeTab === 0 && (
          <>
            <h2 className="text-3xl font-semibold text-blue-700 mb-6 text-center">
              إدارة المستخدمين
            </h2>

            {errorMessage && (
              <p className="text-red-500 mb-4 text-center">{errorMessage}</p>
            )}

            <div className="mb-3">
              <TextInput
                placeholder="الاسم"
                value={newUser.name}
                onChange={(e) =>
                  setNewUser({ ...newUser, name: e.target.value })
                }
              />
              <TextInput
                placeholder="البريد الإلكتروني"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
              />
              <TextInput
                placeholder="رقم الهاتف"
                value={newUser.phone}
                onChange={(e) =>
                  setNewUser({ ...newUser, phone: e.target.value })
                }
              />
              <button
                onClick={handleAddUser}
                className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded w-full sm:w-auto"
                aria-label="Add User"
              >
                إضافة مستخدم
              </button>
            </div>

            <div className="mb-6">
              <TextInput
                placeholder="ابحث عن مستخدم"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <ExportButton
              data={filteredUsers.map(({ id, name, email, phone }) => ({
                id,
                name,
                email,
                phone,
              }))}
              filename="users"
            />

            {loadingUsers ? (
              <p>Loading users...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-300 text-left">
                  <thead className="bg-gray-200 text-gray-700">
                    <tr>
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">الاسم</th>
                      <th className="py-3 px-4">البريد الإلكتروني</th>
                      <th className="py-3 px-4">رقم الهاتف</th>
                      <th className="py-3 px-4">الأدمن</th>
                      <th className="py-3 px-4">حذف</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user, index) => (
                      <tr
                        key={user.id}
                        className={`border-b hover:bg-gray-100 ${user.highlightColor}`}
                      >
                        <td className="py-3 px-4  text-black">{index + 1}</td>
                        <td className="py-3 px-4  text-black">{user.name}</td>
                        <td className="py-3 px-4  text-black">{user.email}</td>
                        <td className="py-3 px-4  text-black">{user.phone}</td>
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
            )}
          </>
        )}

        {activeTab === 1 && (
          <>
            <h2 className="text-3xl font-semibold text-blue-700 mb-6 text-center">
              جدول الحجز
            </h2>

            {/* <AdvancedFilter onFilter={handleFilterAppointments} fields={filterFields} /> */}

            <ExportButton data={filteredAppointments} filename="appointments" />

            {loadingAppointments ? (
              <p>Loading appointments...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-300 text-left">
                  <thead className="bg-gray-200 text-gray-700">
                    <tr>
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">الاسم</th>
                      <th className="py-3 px-4">رقم الهاتف</th>
                      <th className="py-3 px-4">الايميل</th>
                      <th className="py-3 px-4">المكان </th>
                      <th className="py-3 px-4">المحافظة </th>
                      <th className="py-3 px-4">التخصص</th>
                      <th className="py-3 px-4">المواعيد</th>
                      <th className="py-3 px-4">الرسالة</th>
                      <th className="py-3 px-4">حالة الإرسال</th>
                      {/* <th className="py-3 px-4">تاريخ التسجيل</th> */}
                      <th className="py-3 px-4">التعليقات</th>
                      <th className="py-3 px-4">تعديل</th>
                      <th className="py-3 px-4">حذف</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppointments.map((appointment, index) => (
                      <tr
                        key={appointment.id}
                        ref={editingAppointment?.id === appointment.id ? editRef : null}
                        className="border-b hover:bg-gray-100"
                      >
                        <td className="py-3 px-4 text-black">{index + 1}</td>
                        <td className="py-3 px-4 text-black">{appointment.name}</td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleWhatsAppClick(appointment)}
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
                        <td className="py-3 px-4 text-black">{appointment.province}</td>
                        <td className="py-3 px-4 text-black">{appointment.service}</td>
                        <td className="py-3 px-4 text-black">
                          {new Date(appointment.appointment)
                            .toLocaleString("ar-EG", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })
                            .replace("،", " - ")}
                        </td>
                        <td className="py-3 px-4 text-black">{appointment.message}</td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleAppointmentDataSent(appointment.id)}
                            className={`py-1 px-3 rounded w-full ${
                              appointment.dataSent ? "bg-green-500" : "bg-yellow-500"
                            } text-white`}
                          >
                            {appointment.dataSent ? "تم الإرسال" : "لم يتم الإرسال"}
                          </button>
                        </td>
                        {/* <td className="py-3 px-4 text-black">
                          {new Date(appointment.registrationDate || appointment.appointment)
                            .toLocaleDateString('ar-EG')}
                        </td> */}
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleOpenCommentModal(appointment)}
                            className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded w-full"
                          >
                            {appointment.comments ? "تعديل التعليق" : "إضافة تعليق"}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-black">
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
            )}

            {editingAppointment && (
              <div className="mt-6" ref={editRef}>
                <h3 className="text-2xl font-semibold text-blue-700 mb-4 text-center">
                  تعديل الموعد
                </h3>
                <div className="mb-3">
                  <TextInput
                    placeholder="الاسم"
                    name="name"
                    value={editingAppointment.name}
                    onChange={handleChange}
                  />
                  <TextInput
                    placeholder="رقم الهاتف"
                    name="phone"
                    value={editingAppointment.phone}
                    onChange={handleChange}
                  />
                  <TextInput
                    placeholder="الايميل"
                    name="email"
                    value={editingAppointment.email}
                    onChange={handleChange}
                  />
                  <TextInput
                    placeholder="المكان"
                    name="clinicOrCenter"
                    value={editingAppointment.clinicOrCenter}
                    onChange={handleChange}
                  />
                  <TextInput
                    placeholder="المحافظة"
                    name="province"
                    value={editingAppointment.province}
                    onChange={handleChange}
                  />
                  <TextInput
                    placeholder="التخصص"
                    name="service"
                    value={editingAppointment.service}
                    onChange={handleChange}
                  />
                  <TextInput
                    placeholder="المواعيد"
                    name="appointment"
                    value={editingAppointment.appointment}
                    onChange={handleChange}
                  />
                  <TextInput
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
          </>
        )}

        {/* {activeTab === 2 && (
          <Statistics 
            appointments={appointments}
            onAddAppointment={handleAddAppointment}
          />
        )} */}

        {activeTab === 2 && (
          <Statistics appointments={appointments} users={users} />
        )}

        {/* Comment Modal */}
        {showCommentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-lg mx-4">
              <h3 className="text-xl font-semibold text-blue-700 mb-4">إضافة تعليق</h3>
              <textarea
                className="w-full p-3 border rounded-lg mb-4 min-h-[150px]"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="اكتب تعليقك هنا..."
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleCloseCommentModal}
                  className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveComment}
                  className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
                >
                  حفظ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = () => setHasError(true);
    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  if (hasError) {
    return <div>حدث خطأ ما. يرجى إعادة تحميل الصفحة.</div>;
  }

  return children;
};

export default function App() {
  return (
    <ErrorBoundary>
      <UserTable />
    </ErrorBoundary>
  );
}
