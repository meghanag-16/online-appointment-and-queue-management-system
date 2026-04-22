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
    
    @Query(value = "SELECT user_id, name, username, email, role, account_status FROM users", nativeQuery = true)
    List<Object[]> findAllUsersRaw();

    @Query(value = "SELECT user_id, name, username, email, role, account_status FROM users WHERE role = 'DOCTOR'", nativeQuery = true)
    List<Object[]> findAllDoctorUsersRaw();
}
