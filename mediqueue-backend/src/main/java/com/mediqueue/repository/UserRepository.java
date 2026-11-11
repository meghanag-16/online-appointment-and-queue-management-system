package com.mediqueue.repository;

import com.mediqueue.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    long countByRole(com.mediqueue.entity.enums.UserRole role);
    long countByAccountStatus(com.mediqueue.entity.enums.AccountStatus status);
    long countByRoleAndAccountStatus(com.mediqueue.entity.enums.UserRole role, com.mediqueue.entity.enums.AccountStatus status);
    List<User> findByRoleAndAccountStatus(com.mediqueue.entity.enums.UserRole role, com.mediqueue.entity.enums.AccountStatus status);
    List<User> findByAccountStatus(com.mediqueue.entity.enums.AccountStatus status);

    /*
     * Native projections: rows created outside the app (e.g. by hand in MySQL) may lack a row in
     * their role sub-table, which JPA's JOINED inheritance cannot load. These queries read the
     * users table directly so such rows still show up in admin lists.
     */
    @Query(value = "SELECT user_id, name, username, email, role, account_status FROM users ORDER BY role, name",
           nativeQuery = true)
    List<Object[]> findAllUsersRaw();

    @Query(value = "SELECT user_id, name, username, email, role, account_status FROM users WHERE role = 'DOCTOR'",
           nativeQuery = true)
    List<Object[]> findAllDoctorUsersRaw();
}
